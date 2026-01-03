"use client";

import { useApp } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Shield, User as UserIcon, MoreHorizontal, Loader2, Check, X, Users, Star } from "lucide-react"; // Added Users, Star
import { useState } from "react";
import { cn } from "@/lib/utils";
// Actually proper dropdowns in raw React without Shadcn components installed involves state.
// I'll use a simple conditional render for "Manage" actions.

export default function TeamDetails() {
    const { team, user, manageRole, approveMember, rejectMember, removeMember } = useApp();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    if (!team || !user) return null;

    const isCoordinator = user.role === "creator" || user.role === "coordinator";
    const isCreator = user.role === "creator";
    const coordinators = team.members.filter(m => m.role === "creator" || m.role === "coordinator");
    const members = team.members.filter(m => m.role === "member");
    const pending = team.pendingMembers || [];

    const handlePromote = async (userId: string) => {
        setLoadingId(userId);
        await manageRole(userId, "coordinator");
        setLoadingId(null);
    };

    const handleDemote = async (userId: string) => {
        setLoadingId(userId);
        await manageRole(userId, "member");
        setLoadingId(null);
    };

    const handleApprove = async (userId: string) => {
        setLoadingId(userId);
        await approveMember(userId);
        setLoadingId(null);
    };

    const handleReject = async (userId: string) => {
        setLoadingId(userId);
        await rejectMember(userId);
        setLoadingId(null);
    };

    const handleRemove = async (userId: string) => {
        if (confirm("האם אתה בטוח שברצונך להסיר משתמש זה?")) {
            setLoadingId(userId);
            await removeMember(userId);
            setLoadingId(null);
        }
    };

    // Calculate real activity score based on poll responses
    const calculateActivityScore = () => {
        if (!team.polls || team.polls.length === 0) return 0;

        const totalPolls = team.polls.filter(p => !p.active).length; // Only closed polls
        if (totalPolls === 0) return 0;

        const totalYesResponses = team.polls
            .filter(p => !p.active)
            .reduce((sum, poll) => {
                const yesCount = poll.responses.filter(r => r.response === "yes").length;
                return sum + yesCount;
            }, 0);

        const totalMembers = team.members.filter(m => m.role === "member").length;
        if (totalMembers === 0) return 0;

        const averageParticipation = (totalYesResponses / (totalPolls * totalMembers)) * 10;
        return Math.min(10, Math.max(0, averageParticipation)).toFixed(1);
    };

    const activityScore = calculateActivityScore();

    return (
        <div className="space-y-6 pb-24">
            <h2 className="text-2xl font-black text-[var(--color-primary)] px-4">הצוות שלי</h2>

            {/* Team Code Display */}
            {isCoordinator && (
                <div className="mx-4 p-4 bg-blue-50 border-2 border-blue-100 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-blue-500 font-bold uppercase">קוד הצוות</p>
                        <p className="text-2xl font-black text-blue-700 tracking-widest">{team.code}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(team.code)}>
                        העתק
                    </Button>
                </div>
            )}

            {/* Pending Requests */}
            {isCoordinator && pending.length > 0 && (
                <div className="px-4 space-y-3">
                    <h3 className="font-bold text-gray-500 uppercase text-sm flex items-center">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 ml-2 animate-pulse"></span>
                        בקשות הצטרפות ({pending.length})
                    </h3>
                    <div className="space-y-2">
                        {pending.map(m => (
                            <Card key={m.id} className="p-3 flex items-center justify-between border-yellow-200 bg-yellow-50">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                    <div className="w-10 h-10 rounded-full bg-white border-2 border-yellow-200 flex items-center justify-center font-bold text-yellow-600">
                                        {m.avatar}
                                    </div>
                                    <span className="font-bold text-gray-800">{m.name}</span>
                                </div>
                                <div className="flex space-x-2 space-x-reverse">
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-green-500 hover:bg-green-600 border-b-2 border-green-700"
                                        onClick={() => handleApprove(m.id)}
                                        disabled={loadingId === m.id}
                                    >
                                        {loadingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-white" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-8 w-8 p-0 rounded-full bg-red-500 hover:bg-red-600 border-b-2 border-red-700"
                                        onClick={() => handleReject(m.id)}
                                        disabled={loadingId === m.id}
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none p-6 mx-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>

                <h2 className="text-xl font-bold opacity-90 mb-6 text-center">מדד פעילות צוותי</h2>
                <div className="text-center relative z-10">
                    <span className="text-6xl font-black">{activityScore}</span>
                    <span className="text-sm opacity-70 block mt-2">ציון ממוצע (מבוסס על משאלים)</span>

                    <div className="mt-8 pt-6 border-t border-white/20">
                        <p className="text-xs font-bold opacity-80 mb-3 uppercase tracking-widest">הזמנת חברים חדשים</p>
                        <Button
                            className="w-full bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-2xl shadow-xl border-none h-12 flex items-center justify-center gap-2"
                            onClick={() => {
                                const inviteLink = `${window.location.origin}/?team=${team.code}`;
                                navigator.clipboard.writeText(inviteLink);
                                alert("הקישור הועתק! שלחו אותו לחברים בווצאפ 🚀");
                            }}
                        >
                            <Star className="w-5 h-5 fill-indigo-600" />
                            העתק קישור להצטרפות
                        </Button>
                        <p className="mt-2 text-[10px] opacity-60 font-bold">קוד צוות: {team.code}</p>
                    </div>
                </div>
            </Card>

            {/* Coordinators List */}
            <div>
                <h3 className="text-lg font-bold text-gray-700 text-right mb-3 flex items-center justify-end">
                    <Shield className="w-5 h-5 ml-2 text-indigo-500" />
                    רכזים ומנהלים
                </h3>
                <div className="space-y-2">
                    {coordinators.map(member => (
                        <div key={member.id} className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 flex items-center justify-between">
                            <div>
                                {isCreator && member.role === "coordinator" && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 text-xs h-6"
                                        onClick={() => handleDemote(member.id)}
                                        disabled={loadingId === member.id}
                                    >
                                        {loadingId === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "הסר מרכזות"}
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center">
                                <span className="text-sm font-bold text-indigo-900 mr-2">
                                    רכז
                                </span>
                                <span className="font-bold text-gray-700 mr-2">{member.name}</span>
                                <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-600 ml-2">
                                    {member.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Members List */}
            <div>
                <h3 className="text-lg font-bold text-gray-700 text-right mb-3 flex items-center justify-end">
                    <Users className="w-5 h-5 ml-2" />
                    חברי הצוות
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {members.map(member => (
                        <div key={member.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">

                            {/* Actions for Coordinators */}
                            <div className="flex gap-2">
                                {isCoordinator && (
                                    <>
                                        {isCreator && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-indigo-500 hover:bg-indigo-50 h-8"
                                                onClick={() => handlePromote(member.id)}
                                                disabled={loadingId === member.id}
                                            >
                                                <Star className="w-4 h-4 mr-1" />
                                                מנה לרכז
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:bg-red-50 h-8"
                                            onClick={() => handleRemove(member.id)}
                                            disabled={loadingId === member.id}
                                        >
                                            {loadingId === member.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-4 h-4 mr-1" />}
                                            הסר
                                        </Button>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center text-right">
                                <div className="font-bold text-gray-700 mr-3">
                                    {member.name}
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 ml-2">
                                    {member.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
