import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename') || 'default.txt';

    try {
        // We can handle both raw body or multipart/form-data
        // For the simple "Hello World" example, it might be raw body
        const blob = await put(filename, request.body as any, {
            access: 'public',
        });

        return NextResponse.json(blob);
    } catch (error) {
        console.error('Blob upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
