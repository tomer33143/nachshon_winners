"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

interface JoinTeamFormProps {
    onBack: () => void;
    initialCode?: string;
}

export default function JoinTeamForm({ onBack, initialCode = "" }: JoinTeamFormProps) {
    const { joinTeam } = useApp();
    const [code, setCode] = useState(initialCode);
    const [yourName, setYourName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !yourName || !password) return;
        setIsSubmitting(true);
        // Random avatar "1" passed but store generates random now
        await joinTeam(code, yourName, password);
        setIsSubmitting(false);
    };

    return (
        <div className="flex flex-col min-h-screen p-4 max-w-md mx-auto items-center justify-center">
            <div className="w-full mb-6">
                <Button variant="ghost" size="sm" onClick={onBack} className="pr-0">
                    <ArrowRight className="ml-2 h-4 w-4" /> חזרה
                </Button>
            </div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full"
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl text-center text-[var(--color-primary)]">
                            הצטרפות לצוות
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase">קוד הצוות</label>
                                <Input
                                    placeholder="לדוגמה: X9Y2Z1"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    className="text-lg text-center font-mono tracking-widest uppercase"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase">מי אתה? (שם מלא)</label>
                                <Input
                                    placeholder="יוסי בן יוסף"
                                    value={yourName}
                                    onChange={(e) => setYourName(e.target.value)}
                                    className="text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase">סיסמא</label>
                                <Input
                                    placeholder="סיסמא אישית"
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
                                    disabled={isSubmitting || !code || !yourName || !password}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "כנס לצוות!"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
