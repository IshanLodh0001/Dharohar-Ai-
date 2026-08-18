/**
 * POST /api/inspect
 *
 * Accepts multipart/form-data with:
 *   - image (File)
 *   - monument_name, location, inspection_date, inspector_name, notes
 *
 * Runs all 6 Roboflow models server-side (API key never exposed to client).
 * Saves results to data/inspections.json.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { analyzeImage } from '../../lib/roboflow';
import { saveInspection } from '../../lib/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const inspectionId = uuidv4();
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', inspectionId);
  fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 15 * 1024 * 1024, // 15 MB
    filename: () => 'original',
  });

  let fields: formidable.Fields;
  let files: formidable.Files;

  try {
    [fields, files] = await form.parse(req);
  } catch (err: any) {
    return res.status(400).json({ error: `Failed to parse upload: ${err.message}` });
  }

  // Extract image file
  const imageFileArr = files.image;
  const imageFile = Array.isArray(imageFileArr) ? imageFileArr[0] : imageFileArr;

  if (!imageFile) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  // Rename to a clean name with original extension
  const ext = path.extname(imageFile.originalFilename || '.jpg') || '.jpg';
  const finalImagePath = path.join(uploadDir, `original${ext}`);
  if (imageFile.filepath !== finalImagePath) {
    fs.renameSync(imageFile.filepath, finalImagePath);
  }

  // Read image as base64
  let base64Image: string;
  try {
    const buffer = fs.readFileSync(finalImagePath);
    base64Image = buffer.toString('base64');
  } catch (err: any) {
    return res.status(500).json({ error: `Failed to read image: ${err.message}` });
  }

  // Extract metadata fields
  const get = (key: string) =>
    (Array.isArray(fields[key]) ? fields[key]![0] : fields[key] ?? '') as string;

  const monumentName = get('monument_name') || 'Unknown Monument';
  const location = get('location') || '';
  const inspectionDate = get('inspection_date') || new Date().toISOString().split('T')[0];
  const inspectorName = get('inspector_name') || '';
  const notes = get('notes') || '';

  // Run all 6 Roboflow models
  let results;
  try {
    results = await analyzeImage(base64Image);
  } catch (err: any) {
    return res.status(500).json({ error: `AI analysis failed: ${err.message}` });
  }

  // Public image path (served from /public)
  const publicImagePath = `/uploads/${inspectionId}/original${ext}`;

  // Save inspection record
  const record = {
    id: inspectionId,
    monumentName,
    location,
    inspectionDate,
    inspectorName,
    notes,
    imagePath: publicImagePath,
    results,
    createdAt: new Date().toISOString(),
  };

  try {
    saveInspection(record);
  } catch (err: any) {
    console.error('Failed to save inspection:', err);
    // Don't fail the request — return results even if storage failed
  }

  return res.status(200).json({
    success: true,
    inspectionId,
    ...record,
  });
}
