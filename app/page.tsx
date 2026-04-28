import Image from "next/image";
import Link from "next/link";
import {
  Map,
  ScrollText,
  Coins,
  Swords,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative">
      {/* Hero — text left, 3D board right */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 war-grid" />
        <div className="relative max-w-[1480px] mx-auto px-4 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] gap-8 lg:gap-6 items-center">
            {/* Left — Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-5 animate-fadeInUp">
                <div className="h-px w-8 bg-war-gold" />
                <span className="font-display text-[11px] text-war-gold tracking-[0.4em]">
                  CHESS · IS · WAR
                </span>
                <div className="h-px w-8 bg-war-gold" />
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-[0.02em] mb-5 animate-fadeInUp delay-150 leading-[0.95]">
                <span className="text-war-gradient">TROJAN</span>
                <br />
                <span className="text-war-gradient">FALL</span>
              </h1>

              <p className="text-war-muted text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fadeInUp delay-250">
                Шахматы как тактическая война. Зоны контроля в реальном времени.
                AI-разбор военным языком — без сухих цифр.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-8 animate-fadeInUp delay-350">
                <Link href="/play" className="btn-primary">
                  <Swords className="w-4 h-4" /> Начать битву
                </Link>
                <Link href="/match/new" className="btn-secondary">
                  <Coins className="w-4 h-4" /> Дуэль с другом
                </Link>
              </div>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 animate-fadeInUp delay-450">
                <Stat label="Online" value="47+" color="text-war-cyan" />
                <Divider />
                <Stat label="Матчей" value="1.2K" color="text-war-gold" />
                <Divider />
                <Stat label="Из КЗ" value="92%" color="text-war-green" />
              </div>
            </div>

            {/* Right — 3D chess board (BIG) */}
            <div className="relative flex items-center justify-center lg:justify-end -mr-2 lg:-mr-8 xl:-mr-16">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[90%] h-[80%] rounded-full bg-war-cyan/30 blur-[120px] animate-cyanPulse" />
              </div>
              <div className="relative w-full max-w-[760px] lg:max-w-none lg:w-[110%] xl:w-[120%] animate-floatBoard">
                <Image
                  src="/chess-3d.png"
                  alt="3D chess board"
                  width={1200}
                  height={820}
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="w-full h-auto board-glow select-none"
                />
              </div>
              <div className="hidden xl:block absolute top-6 -right-2 panel liquid-glass px-3 py-1.5 z-10">
                <span className="font-mono text-[10px] tracking-widest text-war-cyan">
                  ◇ TACTICAL · WAR · ENGINE
                </span>
              </div>
              <div className="hidden xl:block absolute bottom-10 -left-2 panel liquid-glass px-3 py-1.5 z-10">
                <span className="font-mono text-[10px] tracking-widest text-war-gold">
                  ✦ NEW · SEASON · 01
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16 relative">
        <div className="text-center mb-10">
          <div className="font-display text-[10px] tracking-[0.4em] text-war-gold mb-2">
            КАМПАНИЯ · FEATURES
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-black tracking-wider">
            Не просто шахматы — <span className="text-war-gradient">кампания</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Feature
            icon={<Map className="w-6 h-6" />}
            title="Battle Board"
            text="Карта зон контроля прямо на доске. Синее — твоё. Красное — враг. Фиолет — спорная территория."
          />
          <Feature
            icon={<ScrollText className="w-6 h-6" />}
            title="War Report"
            text="AI Coach разбирает партию военным языком на русском. Не цифры — тактика и понятные советы."
          />
          <Feature
            icon={<Coins className="w-6 h-6" />}
            title="Дукаты & Дуэль"
            text="Внутренняя военная валюта. Создавай матч с дуэлью — победитель забирает весь пот. Каждая партия — реальный риск."
          />
        </div>
      </section>

      {/* Differentiators */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-[10px] tracking-[0.3em] text-war-gold font-mono mb-2">
              ПОЧЕМУ TROJAN FALL
            </div>
            <h2 className="text-3xl font-black mb-4 leading-snug">
              Все показывают цифры.
              <br />
              Мы объясняем почему ты проиграл —
              <br />
              <span className="text-war-gold">и как это исправить.</span>
            </h2>
            <ul className="space-y-3 text-war-muted">
              <BulletEmoji emoji="🧠">
                Разбор каждой партии на русском — без engine-жаргона
              </BulletEmoji>
              <BulletEmoji emoji="🗺️">
                Видишь где потерял контроль — зоны прямо на доске
              </BulletEmoji>
              <BulletEmoji emoji="⚔️">
                Дуэль с другом — со способностями и своей валютой
              </BulletEmoji>
              <BulletEmoji emoji="🏆">
                Боевые звания — каждая победа имеет вес
              </BulletEmoji>
              <BulletEmoji emoji="🇰🇿">
                Создано для игроков СНГ и Казахстана
              </BulletEmoji>
            </ul>
          </div>

          <div className="panel p-6 space-y-4">
            <h3 className="text-war-gold font-bold mb-2">Trojan Fall vs остальные</h3>
            <Compare label="Разбор партии"   yes="Объяснение на русском" them="Только цифры" />
            <Compare label="Карта контроля"  yes="В реальном времени"    them="—" />
            <Compare label="Язык"            yes="Русский / Казахский"   them="Только English" />
            <Compare label="После поражения" yes="Понял. Исправил."      them="Смотришь снова" />
            <Compare label="Режим с другом"  yes="Дуэль + способности"   them="Обычная игра" />
          </div>
        </div>
      </section>

      {/* Stakes section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="panel p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-war-gold/15 border border-war-gold/40 flex items-center justify-center">
                <Coins className="w-6 h-6 text-war-gold" />
              </div>
              <div>
                <div className="text-war-gold font-bold text-xl">Дукаты</div>
                <div className="text-war-muted text-xs">Внутренняя валюта войны</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-war-muted">
              <div className="flex justify-between border-t border-war-border/60 pt-2">
                <span>Стартовый капитал</span>
                <span className="text-war-gold font-bold">500 Δ</span>
              </div>
              <div className="flex justify-between border-t border-war-border/60 pt-2">
                <span>Победа над AI</span>
                <span className="text-emerald-400 font-bold">+25 Δ</span>
              </div>
              <div className="flex justify-between border-t border-war-border/60 pt-2">
                <span>Бонус за accuracy &gt; 80%</span>
                <span className="text-emerald-400 font-bold">+15 Δ</span>
              </div>
              <div className="flex justify-between border-t border-war-border/60 pt-2">
                <span>Победа в матче с дуэлью</span>
                <span className="text-emerald-400 font-bold">2× дуэль</span>
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] tracking-[0.3em] text-war-gold font-mono mb-2">
              СТАВКИ МЕЖДУ КОМАНДИРАМИ
            </div>
            <h2 className="text-3xl font-black mb-4">
              Каждая битва — <span className="text-war-gold">реальный риск</span>
            </h2>
            <p className="text-war-muted leading-relaxed mb-4">
              Создавай матч с другом и ставь дукаты на победу. Оба бойца кладут дуэль в общий
              пот — победитель забирает всё, ничья возвращает деньги. Никаких реальных денег,
              только военная честь и стратегия.
            </p>
            <Link href="/match/new" className="btn-primary inline-flex">
              <Coins className="w-4 h-4" /> Создать дуэль
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="panel p-6 hover:border-war-gold/40 transition-colors group">
      <div className="w-10 h-10 rounded-lg bg-war-gold/10 border border-war-gold/30 text-war-gold flex items-center justify-center mb-3 group-hover:bg-war-gold group-hover:text-black transition-colors">
        {icon}
      </div>
      <div className="text-war-text font-bold text-lg mb-1">{title}</div>
      <div className="text-war-muted text-sm leading-relaxed">{text}</div>
    </div>
  );
}

function BulletEmoji({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-7 h-7 shrink-0 rounded-md bg-war-gold/10 border border-war-gold/30 flex items-center justify-center mt-0.5 text-base leading-none">
        {emoji}
      </span>
      <span className="text-war-text leading-relaxed">{children}</span>
    </li>
  );
}

function Compare({
  label,
  yes,
  them,
}: {
  label: string;
  yes: string;
  them: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 text-sm border-t border-war-border/60 pt-3">
      <div className="text-war-muted">{label}</div>
      <div className="text-war-gold font-semibold">{yes}</div>
      <div className="text-war-dim line-through text-right">{them}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className={`font-display text-2xl sm:text-3xl font-black ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.22em] text-war-muted font-bold mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-8 bg-war-border" />;
}
