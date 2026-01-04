"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle, ExternalLink } from 'lucide-react';

export default function TestBlobPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const testUpload = async () => {
        setStatus('loading');
        try {
            // We use the API route we just created
            const response = await fetch('/api/upload?filename=hello-world.txt', {
                method: 'POST',
                body: 'Hello World! This is a test from the nachshon_winners app.',
            });

            const data = await response.json();
            if (data.url) {
                setBlobUrl(data.url);
                setStatus('success');
            } else {
                setStatus('error');
            }
        } catch (e) {
            console.error(e);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 space-y-6 text-right">
                <h1 className="text-2xl font-black text-indigo-900 mb-2">בדיקת Vercel Blob</h1>
                <p className="text-gray-500 font-medium">לחיצה על הכפתור תעלה קובץ טקסט עם הכיתוב "Hello World" לסטורג'.</p>

                <div className="flex flex-col items-center space-y-4">
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={testUpload}
                        disabled={status === 'loading'}
                        fullWidth
                    >
                        {status === 'loading' ? <Loader2 className="animate-spin" /> : "שגר קובץ לבדיקה! 🚀"}
                    </Button>

                    {status === 'success' && blobUrl && (
                        <div className="w-full p-4 bg-green-50 border border-green-100 rounded-2xl space-y-2">
                            <div className="flex items-center justify-end text-green-600 font-bold">
                                <span className="mr-2">הקובץ עלה בהצלחה!</span>
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <a
                                href={blobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-end text-sm text-indigo-600 font-bold hover:underline"
                            >
                                <span className="mr-2">צפה בקובץ</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="w-full p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 font-bold">
                            אופס! הייתה שגיאה בהעלאה. וודא שהזנת את ה-Token נכון.
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
