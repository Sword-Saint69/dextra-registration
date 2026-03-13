import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

        const externalFormData = new FormData();
        const source = formData.get('source');
        if (source) externalFormData.append('image', source);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: 'POST',
            body: externalFormData
        });

        const data = await response.json();
        // Standardize the shape slightly if needed, but ImgBB returns { data: { url: "..." }, status: 200 }
        // FreeImage returned { status_code: 200, image: { url: "..." } }
        // Let's transform it to match what UploadButton expects
        if (data.status === 200) {
            return NextResponse.json({
                status_code: 200,
                image: { url: data.data.url }
            });
        }
        return NextResponse.json(data);
    } catch (error) {
        console.error('ImgBB Proxy Error:', error);
        return NextResponse.json({
            status_code: 500,
            error: { message: 'Internal Server Error' }
        }, { status: 500 });
    }
}
