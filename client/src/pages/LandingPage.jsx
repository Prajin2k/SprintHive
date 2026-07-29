import { Link } from 'react-router-dom';

// ── Feature data ────────────────────────────────────────────────
const features = [
  {
    icon: '⚡',
    title: 'Lightning-fast Kanban',
    desc: 'Drag-and-drop boards with real-time sync across your entire team.',
  },
  {
    icon: '🔔',
    title: 'Real-time Notifications',
    desc: 'Socket-powered live updates — never miss a status change or comment.',
  },
  {
    icon: '📊',
    title: 'Analytics & Reporting',
    desc: 'Velocity charts, burndown graphs, and exportable PDF reports.',
  },
  {
    icon: '🗓️',
    title: 'Calendar View',
    desc: 'Timeline and calendar views to visualize sprint schedules effortlessly.',
  },
  {
    icon: '🔐',
    title: 'Role-based Access',
    desc: 'Granular permissions — Owner, Admin, Member, and Viewer roles.',
  },
  {
    icon: '📎',
    title: 'File Attachments',
    desc: 'Attach files directly to tasks. Cloudinary or local disk storage.',
  },
];

const stats = [
  { value: '10k+', label: 'Active Teams' },
  { value: '1M+', label: 'Tasks Completed' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '<50ms', label: 'Avg Latency' },
];

// ── Sub-components ───────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/5">
      <div className="flex items-center gap-2">
        {/* Bee logo mark */}
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-lg shadow-glow-sm">
          🐝
        </div>
        <span className="font-bold text-lg tracking-tight">
          Sprint<span className="text-brand-400">Hive</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
      </div>

      <div className="flex items-center gap-3">
        <Link to="/login" className="btn-ghost btn-sm">Log in</Link>
        <Link to="/register" className="btn-primary btn-sm">
          Get Started Free
        </Link>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden bg-mesh">
      {/* Background glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-brand-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-blue-600/8 blur-[100px]" />
      </div>

      {/* Badge */}
      <div className="animate-fade-in">
        <span className="badge badge-orange mb-6 px-3 py-1 text-xs uppercase tracking-widest">
          🚀 Now in Public Beta
        </span>
      </div>

      {/* Headline */}
      <h1 className="animate-slide-up text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight max-w-4xl mb-6">
        Ship faster with{' '}
        <span className="text-gradient">Sprint Hive</span>
      </h1>

      <p className="animate-slide-up text-slate-400 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
        The modern project management platform built for engineering teams.
        Real-time Kanban, sprint planning, analytics, and team collaboration —
        all in one place.
      </p>

      {/* CTA Buttons */}
      <div className="animate-fade-in flex flex-col sm:flex-row items-center gap-4 mb-16">
        <Link to="/register" className="btn-primary btn-lg">
          Start for Free — No credit card
        </Link>
        <Link to="/login" className="btn-secondary btn-lg">
          Live Demo →
        </Link>
      </div>

      {/* Stats row */}
      <div className="animate-fade-in grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl w-full">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-brand-400 mb-1">{s.value}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dashboard preview placeholder */}
      <div className="animate-fade-in mt-16 w-full max-w-5xl">
        <div className="relative rounded-2xl overflow-hidden border border-surface-500 shadow-card">
          <div className="bg-surface-800 px-4 py-3 flex items-center gap-2 border-b border-surface-600">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
            <span className="ml-2 text-xs text-slate-500">sprint-hive.app/workspace/alpha-team</span>
          </div>
          {/* Mock Kanban board */}
          <div className="bg-surface-900 p-6 min-h-[280px] flex gap-4 overflow-x-auto no-scrollbar">
            {['Backlog', 'In Progress', 'Review', 'Done'].map((col, ci) => (
              <div key={col} className="flex-shrink-0 w-56">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{col}</span>
                  <span className="badge badge-gray">{[5, 3, 2, 8][ci]}</span>
                </div>
                <div className="space-y-2">
                  {Array.from({ length: [2, 2, 1, 2][ci] }).map((_, ti) => (
                    <div key={ti} className="card-hover p-3 rounded-lg cursor-pointer">
                      <div className="skeleton h-2 w-3/4 mb-2 rounded" />
                      <div className="skeleton h-2 w-1/2 rounded" />
                      <div className="flex items-center justify-between mt-3">
                        <div className={`badge ${['badge-orange', 'badge-blue', 'badge-purple', 'badge-green'][Math.floor(Math.random() * 4)]}`}>
                          {['Feature', 'Bug', 'Chore', 'Epic'][ti % 4]}
                        </div>
                        <div className="w-6 h-6 rounded-full bg-surface-500 border-2 border-surface-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="badge badge-orange mb-4">Everything you need</span>
          <h2 className="text-4xl font-bold mb-4">
            Built for <span className="text-gradient">modern teams</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From solo developers to 200-person engineering orgs — Sprint Hive
            scales with your workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-hover group"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20
                              flex items-center justify-center text-2xl mb-4
                              group-hover:bg-brand-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    { num: '01', title: 'Create your workspace', desc: 'Invite your team and set up roles in minutes.' },
    { num: '02', title: 'Define your projects', desc: 'Organize work into projects with custom workflows.' },
    { num: '03', title: 'Sprint & ship', desc: 'Plan sprints, track velocity, and ship with confidence.' },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 bg-surface-800/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How it works</h2>
          <p className="text-slate-400">Get your team up and running in under 5 minutes.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.num} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-brand-500/40 to-transparent -z-10" />
              )}
              <div className="text-5xl font-black text-gradient opacity-60 mb-3">{s.num}</div>
              <h3 className="font-semibold text-white text-lg mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="relative rounded-2xl overflow-hidden p-12 glass border border-brand-500/20">
          {/* Glow */}
          <div className="absolute inset-0 bg-gradient-radial from-brand-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">🐝</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to move faster?
            </h2>
            <p className="text-slate-400 mb-8">
              Join thousands of teams already using Sprint Hive to ship better products.
            </p>
            <Link to="/register" className="btn-primary btn-lg">
              Create Free Workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-surface-700 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐝</span>
          <span className="font-semibold">Sprint<span className="text-brand-400">Hive</span></span>
        </div>
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Sprint Hive. Built with MERN + ❤️
        </p>
        <div className="flex gap-6 text-xs text-slate-500">
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Status</a>
        </div>
      </div>
    </footer>
  );
}

// ── Main Landing Page ────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="dark min-h-screen bg-surface-900 text-white">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
