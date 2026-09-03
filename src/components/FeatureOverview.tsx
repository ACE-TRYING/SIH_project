import React from 'react';
import { BrainCircuit, CloudSun, MapPinned, ShieldCheck, Workflow } from 'lucide-react';

const features = [
  {
    icon: SatelliteIcon,
    number: '01',
    title: 'Detect from space',
    text: 'NASA FIRMS satellite feeds reveal thermal activity across industrial zones, forests, mines, and farmland.',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  },
  {
    icon: MapPinned,
    number: '02',
    title: 'Add the context',
    text: 'Every signal is placed beside mapped facilities, strategic assets, land cover, and operational buffer zones.',
    color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: CloudSun,
    number: '03',
    title: 'Understand the spread',
    text: 'Real weather observations show wind direction and help responders understand possible downwind movement.',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: BrainCircuit,
    number: '04',
    title: 'Decide with confidence',
    text: 'Explainable rules and Gemini decision support turn raw detections into a prioritised, evidence-based response.',
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
  },
];

function SatelliteIcon(props: React.ComponentProps<typeof ShieldCheck>) {
  return <ShieldCheck {...props} />;
}

interface FeatureOverviewProps {
  onOpenDataManagement: () => void;
  onOpenSegregationMatrix: () => void;
}

export const FeatureOverview: React.FC<FeatureOverviewProps> = ({ onOpenDataManagement, onOpenSegregationMatrix }) => (
  <section id="features" className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/80 bg-tactical-grid px-4 py-14 sm:px-6 lg:px-8 transition-colors duration-200">
    <div className="mx-auto max-w-[1500px]">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
          <Workflow className="h-4 w-4" />
          One clear response workflow
        </div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">From a heat signal to a decision.</h2>
        <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">ThermalPulse brings the evidence together in four simple steps, so teams can move from detection to action without switching between disconnected tools.</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {features.map(({ icon: Icon, number, title, text, color }) => (
          <article key={number} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${color}`}><Icon className="h-5 w-5" /></div>
              <span className="text-sm font-mono font-bold text-slate-300 dark:text-slate-700">{number}</span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{text}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl bg-slate-950 p-6 text-white sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950"><ShieldCheck className="h-5 w-5" /></div>
            <div>
              <h3 className="text-xl font-bold">Built for responsible response</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Every incident shows where its evidence came from. Live telemetry, derived scores, heuristic classifications, AI synthesis, and unavailable data are kept visibly separate.</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-mono text-slate-300">
                <span className="rounded-lg border border-slate-700 px-2.5 py-1.5">NASA FIRMS</span>
                <span className="rounded-lg border border-slate-700 px-2.5 py-1.5">OpenStreetMap</span>
                <span className="rounded-lg border border-slate-700 px-2.5 py-1.5">Open-Meteo</span>
                <span className="rounded-lg border border-slate-700 px-2.5 py-1.5">Gemini AI</span>
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-6 dark:border-cyan-900/70 dark:bg-cyan-950/20 sm:p-8">
          <h3 className="text-xl font-bold text-slate-950 dark:text-white">Explore the evidence</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Load a live FIRMS feed or open the classification logic to see how each signal becomes an operational priority.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onOpenDataManagement} className="rounded-lg bg-cyan-600 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-cyan-700">Open data sources</button>
            <button onClick={onOpenSegregationMatrix} className="rounded-lg border border-cyan-300 bg-white/70 px-3.5 py-2.5 text-xs font-bold text-cyan-800 transition hover:bg-white dark:border-cyan-800 dark:bg-slate-900/60 dark:text-cyan-300">View decision logic</button>
          </div>
        </div>
      </div>
    </div>
  </section>
);
