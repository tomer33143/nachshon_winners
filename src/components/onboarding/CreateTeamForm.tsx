"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

interface CreateTeamFormProps {
    onBack: () => void;
}

export default function CreateTeamForm({ onBack }: CreateTeamFormProps) {
    const { createTeam } = useApp();
    const [teamName, setTeamName] = useState("");
    const [yourName, setYourName] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createTeam(teamName, yourName, password);
            // The Home component should react to user/team being set now
        } catch (err) {
            setIsSubmitting(false);
        }
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
                            יצירת צוות חדש
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase">שם הצוות</label>
                                <Input
                                    placeholder="לדוגמה: צוות נחשון"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    className="text-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase">השם שלך (מנהל)</label>
                                <Input
                                    placeholder="לדוגמה: דוד בן גוריון"
                                    value={yourName}
                                    onChange={(e) => setYourName(e.target.value)}
                                    className="text-lg"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 uppercase">סיסמא</label>
                                <Input
                                    placeholder="בחר סיסמא (זכור אותה!)"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="text-lg"
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    type="submit"
                                    disabled={isSubmitting || !teamName || !yourName || !password}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "צור וכנס ללובי"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
