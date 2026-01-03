"use client";

import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function LoginForm({ onBack }: { onBack: () => void }) {
    const { login } = useApp();
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName || !password) return;
        setIsSubmitting(true);
        await login(userName, password);
        setIsSubmitting(false);
    };

    return (
        <div className="w-full max-w-md mx-auto p-4 space-y-6">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-500 mb-4">
                <ArrowRight className="w-4 h-4 ml-1" />
                חזרה
            </Button>

            <div className="text-center space-y-2 mb-8">
                <h1 className="text-3xl font-black text-[var(--color-primary)] tracking-tight">התחברות</h1>
                <p className="text-gray-500 font-bold">כנס למשתמש שלך</p>
            </div>

            <Card className="p-6 bg-white border-2 border-gray-100 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 uppercase">שם משתמש</label>
                        <Input
                            placeholder="השם שלך"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 uppercase">סיסמא</label>
                        <Input
                            placeholder="הסיסמא שלך"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-lg"
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            type="submit"
                            disabled={isSubmitting || !userName || !password}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : "התחבר"}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
