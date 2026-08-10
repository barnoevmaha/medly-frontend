import { Link } from "react-router-dom";
import { Crown, Settings, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { profile } from "@/data/content";

export default function Profile() {
  return (
    <>
      <Card className="mb-8 p-6 shadow-medium animate-fade-up md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative">
            <Avatar src={profile.avatar} name={profile.name} className="h-24 w-24 border-4 border-card md:h-28 md:w-28" />
            <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-soft">
              <Pencil className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-bold md:text-3xl">{profile.name}</h1>
              {profile.premium && (
                <Badge variant="accent">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
            <p className="mt-0.5 text-muted-foreground">{profile.handle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{profile.school}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Link to="/premium">
              <Button variant="accent">Upgrade</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {profile.stats.map((s) => (
          <Card key={s.label} className="p-5 text-center card-hover">
            <div className="font-display text-2xl font-bold text-gradient">{s.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">{profile.badgesTitle}</h2>
        <Button variant="link" size="sm">View All</Button>
      </div>
      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {profile.badges.map((b) => (
          <Card key={b.label} className="p-5 text-center card-hover">
            <div className="text-3xl" aria-hidden>{b.emoji}</div>
            <div className="mt-2 text-sm font-semibold">{b.label}</div>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 font-display text-2xl font-bold">{profile.activityTitle}</h2>
      <Card className="divide-y divide-border p-0">
        {profile.activity.map((a) => (
          <div key={a.text} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <div className="truncate font-medium">{a.text}</div>
              <div className="text-sm text-muted-foreground">{a.time}</div>
            </div>
            <Badge variant="success">{a.points}</Badge>
          </div>
        ))}
      </Card>
    </>
  );
}
