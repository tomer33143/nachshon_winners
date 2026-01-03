"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, UserPlus } from "lucide-react";

interface SplashScreenProps {
    onModeSelect: (mode: "create" | "join" | "login") => void;
}

export default function SplashScreen({ onModeSelect }: SplashScreenProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-12 text-center max-w-md mx-auto">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
            >
                <h1 className="text-6xl font-black text-indigo-600 tracking-tight drop-shadow-xl animate-bounce">
                    נחשון
                </h1>
                <p className="text-xl text-slate-500 mt-4 font-bold tracking-wide">
                    משחקים יחד. מנצחים יחד.
                </p>
            </motion.div>

            <div className="w-full space-y-4">
                <div className="grid grid-cols-1 gap-4 w-full px-8">
                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onClick={() => onModeSelect("create")}
                        className="shadow-[0_6px_0_var(--color-primary-dark)] active:shadow-none active:translate-y-1.5"
                    >
                        יצירת צוות חדש
                    </Button>

                    <Button
                        variant="default"
                        size="lg"
                        fullWidth
                        onClick={() => onModeSelect("join")}
                        className="shadow-[0_6px_0_#bfdbfe] active:shadow-none active:translate-y-1.5 border-2 border-blue-200"
                    >
                        יש לי קוד צוות
                    </Button>

                    <Button
                        variant="ghost"
                        size="lg"
                        fullWidth
                        onClick={() => onModeSelect("login")}
                        className="text-gray-500 font-bold hover:bg-gray-100"
                    >
                        כניסה למשתמש קיים
                    </Button>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-400"
            >
                בונים צוות חזק יותר, ביחד.
            </motion.div>
        </div>
    );
}
