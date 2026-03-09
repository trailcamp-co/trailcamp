import { Link } from 'react-router-dom';
import { 
  MapPin, Compass, Mountain, Waves, Fish, Bike, 
  TreePine, Target, Tent, ArrowRight, Star, Zap,
  Smartphone, Users, ChevronRight
} from 'lucide-react';

const HOBBIES = [
  { icon: '🏕️', label: 'Camping', count: '30K+' },
  { icon: '🥾', label: 'Hiking', count: '24K+' },
  { icon: '🚙', label: '4x4 / Off-Road', count: '24K+' },
  { icon: '🐎', label: 'Horseback', count: '15K+' },
  { icon: '🚤', label: 'Boating', count: '9K+' },
  { icon: '🚵', label: 'Mountain Biking', count: '7K+' },
  { icon: '🏹', label: 'Hunting', count: '4K+' },
  { icon: '🏊', label: 'Swimming', count: '3K+' },
  { icon: '🏍️', label: 'Dirt Bikes / OHV', count: '1.5K+' },
  { icon: '🧗', label: 'Rock Climbing', count: '1.3K+' },
  { icon: '🎣', label: 'Fishing', count: '1K+' },
  { icon: '🛶', label: 'Kayaking', count: '960+' },
];

const REPLACED_APPS = [
  'OnX Offroad', 'AllTrails', 'iOverlander', 'Campendium', 
  'FreeRoam', 'Gaia GPS', 'HipCamp', 'Fishbrain',
  'MTB Project', 'Mountain Project', 'Boondocking App',
];

const FEATURES = [
  {
    icon: <MapPin size={24} />,
    title: '127,000+ Locations',
    desc: 'Campgrounds, trails, boat ramps, climbing areas, and more — all in one map.',
  },
  {
    icon: <Zap size={24} />,
    title: 'One App, Every Hobby',
    desc: 'Stop switching between 5 apps. Camp, ride, fish, climb, and paddle from one place.',
  },
  {
    icon: <Compass size={24} />,
    title: 'Trip Planning Built In',
    desc: 'Build routes with stops, get driving times, export GPX, and journal your trips.',
  },
  {
    icon: <Smartphone size={24} />,
    title: 'Mobile First',
    desc: 'Built for your phone. Use it on the trail, at camp, or planning from the couch.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-950 text-white">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain size={22} className="text-orange-500" />
            <span className="text-lg font-bold">TrailCamp</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
              Log in
            </Link>
            <Link to="/signup" className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 px-4 py-1.5 rounded-lg transition-colors">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
            <Star size={12} />
            Free to use — no credit card required
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5">
            Every outdoor adventure.
            <br />
            <span className="text-orange-500">One app.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            Camp, hike, ride, fish, climb, paddle — find 127,000+ spots across the US on a single map. 
            Stop juggling apps. Start exploring.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/signup" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-3.5 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-orange-500/20">
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 text-gray-300 font-medium px-8 py-3.5 rounded-xl text-lg transition-colors border border-dark-700">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      {/* Replaces these apps */}
      <section className="py-10 px-4 border-y border-dark-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-4">Replaces</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {REPLACED_APPS.map(app => (
              <span key={app} className="text-sm text-gray-500 line-through decoration-gray-700">{app}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Hobbies grid */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            12 hobbies. 127K+ locations.
          </h2>
          <p className="text-gray-400 text-center mb-10 max-w-lg mx-auto">
            Whether you're setting up camp or sending it on single track, we've got your spots mapped.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {HOBBIES.map(h => (
              <div key={h.label} className="flex items-center gap-3 bg-dark-900 border border-dark-800/50 rounded-xl px-4 py-3 hover:border-dark-700 transition-colors">
                <span className="text-2xl">{h.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{h.label}</div>
                  <div className="text-xs text-gray-500">{h.count} spots</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-dark-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            Built for people who actually go outside
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-dark-900 border border-dark-800/50 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services section */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Plus the boring stuff you need</h2>
          <p className="text-gray-400 mb-8">Dump stations, water fill-ups, and overnight parking — all mapped.</p>
          <div className="flex justify-center gap-6 text-center">
            <div>
              <span className="text-3xl">💧</span>
              <p className="text-sm text-gray-400 mt-1">Water Stations</p>
            </div>
            <div>
              <span className="text-3xl">🚽</span>
              <p className="text-sm text-gray-400 mt-1">Dump Stations</p>
            </div>
            <div>
              <span className="text-3xl">🅿️</span>
              <p className="text-sm text-gray-400 mt-1">Overnight Parking</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to simplify your outdoor life?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Free forever. No ads. No BS.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-lg hover:shadow-orange-500/25">
            Create Free Account
            <ChevronRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800/50 py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Mountain size={16} className="text-orange-500" />
            <span>TrailCamp © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <a href="mailto:hello@trailcamp.co" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
