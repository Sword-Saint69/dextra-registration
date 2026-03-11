import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const apiKey = process.env.NEXT_PUBLIC_FREEIMAGE_API_KEY;

        const externalFormData = new FormData();
        const source = formData.get('source');
        if (source) externalFormData.append('source', source);
        externalFormData.append('action', 'upload');
        externalFormData.append('format', 'json');

        const response = await fetch(`https://freeimage.host/api/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: externalFormData
        });

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('FreeImage Proxy Error:', error);
        return NextResponse.json({
            status_code: 500,
            error: { message: 'Internal Server Error' }
        }, { status: 500 });
    }
}
