import { useState } from "react";
import { Users, BookOpen, Brain, Zap, Check, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { premium } from "@/data/content";
import { cn } from "@/lib/utils";

const icons = { users: Users, book: BookOpen, brain: Brain, zap: Zap } as const;

export default function Premium() {
  const [selected, setSelected] = useState(
    premium.plans.find((p) => p.popular)?.id ?? premium.plans[0].id
  );

  return (
    <>
      <header className="mb-10 text-center animate-fade-up">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-accent shadow-glow">
          <Crown className="h-8 w-8 text-accent-foreground" />
        </div>
        <h1 className="mt-5 font-display text-3xl font-bold md:text-4xl">{premium.title}</h1>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">{premium.subtitle}</p>
      </header>

      <div className="mb-12 grid gap-4 sm:grid-cols-2">
        {premium.benefits.map((b) => {
          const Icon = icons[b.icon as keyof typeof icons];
          return (
            <Card key={b.title} className="flex gap-4 p-5 card-hover">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{b.body}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mb-12 grid gap-5 sm:grid-cols-2">
        {premium.plans.map((p) => {
          const active = selected === p.id;
          return (
            <Card
              key={p.id}
              className={cn(
                "relative flex flex-col p-7 transition-all",
                active ? "ring-2 ring-primary shadow-medium" : "card-hover"
              )}
            >
              {p.popular && (
                <Badge variant="solid" className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <h3 className="font-display text-xl font-bold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.blurb}</p>
              <div className="mt-5 flex items-end gap-1">
                <span className="font-display text-4xl font-bold text-gradient">{p.price}</span>
                <span className="pb-1.5 text-muted-foreground">{p.period}</span>
              </div>
              <Button
                className="mt-6 w-full"
                variant={p.popular ? "accent" : "outline"}
                onClick={() => setSelected(p.id)}
              >
                {p.cta}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="p-7">
        <h2 className="font-display text-xl font-bold">{premium.includedTitle}</h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {premium.included.map((item) => (
            <li key={item} className="flex items-center gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15">
                <Check className="h-3 w-3 text-success" />
              </span>
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
