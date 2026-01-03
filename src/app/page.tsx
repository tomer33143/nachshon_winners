"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import SplashScreen from "@/components/onboarding/SplashScreen";
import CreateTeamForm from "@/components/onboarding/CreateTeamForm";
import JoinTeamForm from "@/components/onboarding/JoinTeamForm";
import LoginForm from "@/components/onboarding/LoginForm"; // Import
import Lobby from "@/components/onboarding/Lobby";
import Feed from "@/components/dashboard/Feed";
import Leaderboard from "@/components/dashboard/Leaderboard";
import Calendar from "@/components/dashboard/Calendar";
import TeamDetails from "@/components/dashboard/TeamDetails";
import CoordinatorDashboard from "@/components/dashboard/CoordinatorDashboard";
import PollPopup from "@/components/dashboard/PollPopup";

import { List, Trophy, Loader2, CalendarRange, Users, Zap, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export default function Home() {
  const { user, team, isLoading, logout } = useApp();
  const [view, setView] = useState<"splash" | "create" | "join" | "login">("splash");
  const [teamFromUrl, setTeamFromUrl] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "leaderboard" | "calendar" | "team" | "power" | "profile">("feed");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const teamCode = params.get("team");
    if (teamCode) {
      setTeamFromUrl(teamCode);
      setView("join");
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-page)]">
        <div className="animate-spin text-4xl text-[var(--color-primary)]">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      </div>
    )
  }

  // 1. If no user/team, show Onboarding Flow
  if (!user || !team) {
    if (view === "create") return <CreateTeamForm onBack={() => setView("splash")} />;
    if (view === "join") return <JoinTeamForm onBack={() => setView("splash")} initialCode={teamFromUrl || ""} />;
    if (view === "login") return <LoginForm onBack={() => setView("splash")} />;
    return <SplashScreen onModeSelect={setView} />;
  }

  // 2. Pending Approval -> Show Lobby (Waiting Screen)
  const isPending = team.pendingMembers?.some((m: any) => m.id === user.id);
  if (isPending) {
    return <Lobby />;
  }

  const isCoordinator = user.role === "creator" || user.role === "coordinator";

  // Filter history for current user
  const userHistory = team.feed?.filter((item: any) => item.userId === user.id) || [];

  // 3. Main Dashboard
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <PollPopup />

      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => setActiveTab("profile")}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border-2 border-white shadow-sm flex items-center justify-center font-bold text-white transition-transform hover:scale-105"
          >
            {user.name.charAt(0)}
          </button>
          <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-xl font-bold text-sm flex items-center shadow-sm border border-orange-200">
            <Zap className="w-3 h-3 ml-1 fill-orange-500" />
            {user.strikes}
          </div>
        </div>

        <h1 className="text-xl font-black tracking-tight text-indigo-900">
          {activeTab === "profile" ? "הפרופיל שלי" : team.name}
        </h1>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
          </button>

          {showMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-gray-50 mb-1">
                <p className="text-sm font-black text-gray-800">{user.name}</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{user.role}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full text-right px-4 py-3 text-sm text-red-500 font-bold hover:bg-red-50 flex items-center justify-end"
              >
                <span className="mr-2">צא מהמערכת</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pt-6 max-w-md mx-auto w-full overflow-x-hidden">
        {activeTab === "feed" && <Feed />}
        {activeTab === "leaderboard" && <Leaderboard />}
        {activeTab === "calendar" && <Calendar />}
        {activeTab === "team" && <TeamDetails />}
        {activeTab === "power" && isCoordinator && <CoordinatorDashboard />}

        {activeTab === "profile" && (
          <div className="px-4 space-y-6 animate-in slide-in-from-left-4">
            <Card className="p-8 text-center bg-white border-none shadow-xl rounded-[40px] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 mx-auto mb-4 flex items-center justify-center text-3xl font-black text-white shadow-2xl border-4 border-white">
                  {user.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-gray-800">{user.name}</h2>
                <p className="text-indigo-500 font-bold text-sm mb-6">{team.name} • {user.role === "member" ? "חבר" : "רכז"}</p>

                {!isCoordinator && (
                  <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                    <div>
                      <p className="text-2xl font-black text-indigo-600">{user.pointsAnnual}</p>
                      <p className="text-[10px] text-gray-400 font-bold">נקודות</p>
                    </div>
                    <div className="border-x border-gray-100">
                      <p className="text-2xl font-black text-orange-500">{user.strikes}</p>
                      <p className="text-[10px] text-gray-400 font-bold">סטרייק</p>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-purple-600">{user.maxStreak || user.strikes}</p>
                      <p className="text-[10px] text-gray-400 font-bold">שיא</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {!isCoordinator && (
              <div className="space-y-4 pb-20">
                <h3 className="text-lg font-black text-gray-700 text-right px-2">היסטוריה אישית</h3>
                {userHistory.length === 0 ? (
                  <Card className="p-10 text-center bg-gray-50 border-none rounded-3xl">
                    <p className="text-gray-400 text-sm">עוד לא צברת היסטוריה... קדימה לעבוד! 💪</p>
                  </Card>
                ) : (
                  userHistory.map((item: any) => (
                    <Card key={item.id} className="p-4 border-none shadow-sm rounded-2xl flex items-center justify-between">
                      <span className="text-[10px] text-gray-300 font-bold">
                        {new Date(item.timestamp).toLocaleDateString('he-IL')}
                      </span>
                      <p className="text-sm font-bold text-gray-700 text-right flex-1 mr-3">
                        {item.message}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-2 flex justify-between items-center h-20 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] text-xs">
        <NavButton
          active={activeTab === "feed"} onClick={() => setActiveTab("feed")}
          icon={List} label="פיד"
        />
        <NavButton
          active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")}
          icon={CalendarRange} label="לוח שנה"
        />
        <NavButton
          active={activeTab === "team"} onClick={() => setActiveTab("team")}
          icon={Users} label="צוות"
        />
        <NavButton
          active={activeTab === "leaderboard"} onClick={() => setActiveTab("leaderboard")}
          icon={Trophy} label="דירוג" highlight
        />
        {isCoordinator && (
          <NavButton
            active={activeTab === "power"} onClick={() => setActiveTab("power")}
            icon={Zap} label="כוח רכז" highlight
          />
        )}
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label, highlight }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center space-y-1 transition-all w-16",
        active ? (highlight ? "text-[var(--color-yellow-dark)]" : "text-[var(--color-primary)]") : "text-gray-400"
      )}
    >
      <Icon className="w-6 h-6" strokeWidth={active ? 3 : 2} />
      <span className="font-bold">{label}</span>
    </button>
  )
}
