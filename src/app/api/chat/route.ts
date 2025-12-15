import { NextResponse } from 'next/server';
import { generateDateCourse } from '@/services/gemini';

export async function POST(request: Request) {
    try {
        const { message, history, systemContext, transportMode } = await request.json();

        // Validate input
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const response = await generateDateCourse(message, history, systemContext, transportMode);
        return NextResponse.json(response);

    } catch (error) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
