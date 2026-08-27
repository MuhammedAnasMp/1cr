import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const { image, folder = 'pixelverse_media' } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 });
    }

    const uploadRes = await uploadToCloudinary(image, folder);

    return NextResponse.json({
      success: true,
      url: uploadRes.url,
      public_id: uploadRes.public_id,
    });
  } catch (err: any) {
    console.error('Upload API route error:', err);
    return NextResponse.json({ error: err.message || 'Cloudinary upload failed' }, { status: 500 });
  }
}
