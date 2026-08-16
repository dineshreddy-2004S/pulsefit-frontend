import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import founderImg from '../assets/dinesh_reddy.jpg';

export default function LandingPage() {
  const [activeModal, setActiveModal] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  
  const [registerData, setRegisterData] = useState({ 
    name: '', email: '', password: '', phone: '', role: 'GYM_OWNER',
    gym_name: '', gym_logo: '', gym_address: '', city: '', state: '', pincode: '', gst_number: '', otp: ''
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const showcaseGallery = [
    {
      img: founderImg,
      title: "Dinesh Reddy",
      tag: "Founder & Athlete",
      desc: "Visionary fitness architect pioneering intelligent gym automation and athletic tracking."
    },
    {
      img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
      title: "Heavy Iron & Dumbbell Zone",
      tag: "Free Weights Up to 60KG",
      desc: "Commercial Olympic barbells, custom plates, flat/incline benches, and heavy-duty dumbbell racks."
    },
    {
      img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=800&auto=format&fit=crop",
      title: "CrossFit & Functional Rig",
      tag: "HIIT Conditioning",
      desc: "Astro-turf sled tracks, battle ropes, gymnastic rings, kettlebells, and plyometric boxes."
    },
    {
      img: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=800&auto=format&fit=crop",
      title: "Cardiovascular Theater",
      tag: "Biometric Treadmills",
      desc: "Touchscreen curved treadmills, air bikes, concept rowers, and stair climbers with live heart-rate monitoring."
    },
    {
      img: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=800&auto=format&fit=crop",
      title: "Olympic Power Racks & Platforms",
      tag: "Powerlifting",
      desc: "Shock-absorbing deadlift drop platforms, calibrated competition steel plates, and safety squat cages."
    },
    {
      img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
      title: "MMA, Boxing & Combat Ring",
      tag: "Combat & Agility",
      desc: "Heavy punching bags, teardrop speed bags, speed rings, and dedicated martial arts floor mats."
    },
    {
      img: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=800&auto=format&fit=crop",
      title: "Personal Coaching & Assessment",
      tag: "1-on-1 Guidance",
      desc: "Private biomechanics consultation zones, posture screening, and customized training planning."
    },
    {
      img: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=800&auto=format&fit=crop",
      title: "Recovery, Steam & Sauna Suite",
      tag: "Muscle Restoration",
      desc: "Hydro-massage lounge, cedarwood dry sauna, steam bath, and cryo-recovery protocols."
    }
  ];

  const features = [
    {
      icon: "🪪",
      title: "Instant Digital QR Passes",
      tag: "Fast Check-In",
      desc: "Generate scannable QR passes with photo verification that members present directly on smartphones."
    },
    {
      icon: "📊",
      title: "Multi-Horizon Revenue Intelligence",
      tag: "Deep Analytics",
      desc: "Track day-wise receipts, weekly velocity, and 6-month area growth curves with 1-click PDF/Excel export tools."
    },
    {
      icon: "⚡",
      title: "Automated WhatsApp & Email Dues Engine",
      tag: "Zero Bad Debt",
      desc: "Dispatch instant personalized WhatsApp reminders and branded HTML email invoices to all due members."
    },
    {
      icon: "🗓️",
      title: "Flexible Membership & Daily Passes",
      tag: "Custom Tiers",
      desc: "Operational support for Daily passes, 1/2/3/6-Month, Annual, and custom plans with automated expiry dates."
    },
    {
      icon: "💰",
      title: "Membership Fee & Plan Management",
      tag: "Rate Control",
      desc: "Gym owners configure packages and admission charges with read-only desk access for trainers and staff."
    },
    {
      icon: "👥",
      title: "Staff Accounts & Audit Trail",
      tag: "Security Logging",
      desc: "Create staff logins with viewable credentials and inspect real-time logs for member operations."
    }
  ];

  const motivationalQuotes = [
    {
      quote: "Discipline is choosing between what you want now and what you want most.",
      author: "Dinesh Reddy",
      role: "Founder, Pulse Fit OS"
    },
    {
      quote: "The only bad workout is the one that didn't happen. Track your progress, dominate your goals.",
      author: "Arnold Schwarzenegger",
      role: "7x Mr. Olympia"
    },
    {
      quote: "Success isn't always about greatness. It's about consistency. Consistent hard work leads to success.",
      author: "Dwayne Johnson",
      role: "Athlete & Entrepreneur"
    }
  ];

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        setRegisterData(prev => ({ ...prev, gym_logo: canvas.toDataURL('image/jpeg', 0.85) }));
      };
    };
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/auth/login', loginData);
      login(res.data.token, res.data.user);
      navigate(res.data.user.role === 'ADMIN' ? '/admin/users' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRegisterOtp = async () => {
    setError('');
    setSuccess('');
    if (!registerData.email) return setError('Please enter your email to receive OTP.');
    setOtpSending(true);
    try {
      const res = await API.post('/auth/send-register-otp', {
        email: registerData.email,
        name: registerData.name
      });
      setSuccess(res.data.message);
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP email.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!otpSent || !registerData.otp) return setError('Please verify your email via OTP code.');
    setLoading(true);
    try {
      const res = await API.post('/auth/register', registerData);
      setSuccess(res.data.message);
      setOtpSent(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email: forgotEmail });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with this email.');
    } finally {
      setLoading(false);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans selection:bg-[#FF007A] selection:text-white relative overflow-x-hidden">
      
      <div className="fixed top-[-120px] left-1/2 -translate-x-1/2 w-[320px] sm:w-[600px] lg:w-[1100px] h-[350px] sm:h-[450px] bg-gradient-to-r from-[#7928CA]/25 via-[#FF0080]/20 to-[#00F2FE]/20 rounded-full blur-[140px] pointer-events-none z-0"></div>

      {/* 🧭 NAVIGATION HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-2xl bg-[#07090E]/90 border-b border-white/10 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#00F2FE] via-[#7928CA] to-[#FF0080] blur-sm opacity-80 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 border-[#00F2FE] bg-[#0B0F19] shadow-lg">
                <img src={founderImg} alt="Dinesh Reddy" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-2xl font-black tracking-wider leading-none" style={{ background: 'linear-gradient(135deg, #FFFFFF 0%, #00F2FE 40%, #FF0080 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PULSE FIT
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-[#00F2FE] font-bold mt-0.5">
                Dinesh Reddy Platform
              </span>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-xs uppercase tracking-[0.15em] font-extrabold text-slate-300">
            <a href="#about" className="hover:text-[#00F2FE] transition-all">About OS</a>
            <a href="#showcase" className="hover:text-[#00F2FE] transition-all">Gym Facilities</a>
            <a href="#features" className="hover:text-[#00F2FE] transition-all">Features</a>
            <a href="#quotes" className="hover:text-[#00F2FE] transition-all">Motivation</a>
            <a href="#founder" className="hover:text-[#00F2FE] transition-all">Founder</a>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <button onClick={() => { setError(''); setSuccess(''); setActiveModal('login'); }} className="px-5 py-2.5 rounded-xl border border-white/20 text-xs font-bold text-white hover:border-[#00F2FE] hover:text-[#00F2FE] transition-all active:scale-95">
              Sign In
            </button>
            <button onClick={() => { setError(''); setSuccess(''); setActiveModal('register'); }} className="relative group p-[1px] rounded-xl overflow-hidden font-bold text-xs active:scale-95 transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00F2FE] via-[#7928CA] to-[#FF0080] rounded-xl"></div>
              <div className="relative px-5 py-2.5 rounded-xl bg-[#0B0F19] group-hover:bg-transparent text-white transition-all">
                Register Gym
              </div>
            </button>
          </div>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="lg:hidden p-2.5 rounded-xl bg-white/10 border border-white/15 text-white active:scale-95 transition-all focus:outline-none"
          >
            {mobileMenuOpen ? <span className="text-lg font-black block leading-none w-5 text-center">✕</span> : <span className="text-lg font-black block leading-none w-5 text-center">☰</span>}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden mt-3 pt-4 pb-6 border-t border-white/10 px-2 animate-fadeIn space-y-4">
            <nav className="flex flex-col space-y-3 text-xs uppercase tracking-wider font-extrabold text-slate-300">
              <a href="#about" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#00F2FE] transition-all">📖 About Platform</a>
              <a href="#showcase" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#00F2FE] transition-all">🏋️ Gym Facilities</a>
              <a href="#features" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#00F2FE] transition-all">⚡ Platform Features</a>
              <a href="#quotes" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#00F2FE] transition-all">🔥 Motivation & Mindset</a>
              <a href="#founder" onClick={closeMobileMenu} className="px-3 py-2 rounded-lg hover:bg-white/5 hover:text-[#00F2FE] transition-all">👑 Leadership & Founder</a>
            </nav>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
              <button onClick={() => { closeMobileMenu(); setError(''); setSuccess(''); setActiveModal('login'); }} className="w-full py-2.5 rounded-xl border border-white/20 text-xs font-bold text-white bg-white/5 active:scale-95 text-center">
                Sign In
              </button>
              <button onClick={() => { closeMobileMenu(); setError(''); setSuccess(''); setActiveModal('register'); }} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] text-xs font-black text-white active:scale-95 text-center shadow-lg">
                Register Gym
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 🚀 HERO */}
      <section className="pt-28 sm:pt-36 pb-14 sm:pb-16 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/[0.04] border border-[#00F2FE]/40 text-[#00F2FE] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#00F2FE] animate-ping"></span>
              Architected by Dinesh Reddy
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
              ENGINEERED FOR <br />
              <span style={{ background: 'linear-gradient(90deg, #00F2FE 0%, #7928CA 50%, #FF0080 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                FITNESS SUPREMACY
              </span>
            </h1>

            <p className="text-slate-400 text-xs sm:text-sm lg:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              Pulse Fit automates member registration, digital passes, revenue intelligence, and dues recovery for modern fitness facilities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button onClick={() => { setError(''); setSuccess(''); setActiveModal('register'); }} className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] via-[#7928CA] to-[#FF0080] text-white font-black text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(0,242,254,0.4)] transition-all active:scale-95">
                Register Your Gym
              </button>
              <button onClick={() => { setError(''); setSuccess(''); setActiveModal('login'); }} className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/[0.05] border border-white/15 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
                Sign In to Console
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-4 lg:mt-0">
            <div className="relative rounded-3xl p-1 bg-gradient-to-b from-[#00F2FE] via-[#7928CA] to-[#FF0080] shadow-[0_0_50px_rgba(121,40,202,0.35)] max-w-sm mx-auto lg:max-w-none">
              <div className="relative rounded-[22px] overflow-hidden bg-[#07090E]">
                <img src={founderImg} alt="Dinesh Reddy" className="w-full h-[360px] sm:h-[480px] object-cover object-top hover:scale-105 transition-transform duration-700" />
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 bg-gradient-to-t from-black via-black/80 to-transparent">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#00F2FE] tracking-widest block">Chief Architect & Athlete</span>
                  <h3 className="text-lg sm:text-xl font-black text-white">Dinesh Reddy</h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">Automating enterprise gym intelligence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📖 ABOUT & FEATURES */}
      <section id="about" className="py-14 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#00F2FE] px-3 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30">
            Core Operating System
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-3">Built for High-Growth Fitness Facilities</h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium mt-2">
            Pulse Fit replaces disorganized registers and manual calculations with an automated dashboard.
          </p>
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <div key={i} className="p-6 rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl space-y-3 hover:border-[#00F2FE]/50 transition-all group flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-3xl p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#00F2FE]/10 text-[#00F2FE] border border-[#00F2FE]/20">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#00F2FE] transition-colors">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
                <span>Enterprise Grade</span>
                <span className="mx-2">•</span>
                <span className="text-[#00F2FE]">Live Sync</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🏋️ SHOWCASE */}
      <section id="showcase" className="py-14 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#00F2FE] px-3 py-1 rounded-full bg-[#00F2FE]/10 border border-[#00F2FE]/30">
            Training Infrastructure
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white mt-2 sm:mt-3">8 World-Class Training Zones</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {showcaseGallery.map((item, idx) => (
            <div key={idx} className="bg-[#0B0F19] rounded-3xl overflow-hidden border border-white/10 group hover:border-[#00F2FE]/50 shadow-xl transition-all flex flex-col justify-between">
              <div className="h-60 sm:h-72 overflow-hidden relative">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                <span className="absolute top-3 right-3 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[#00F2FE]">
                  {item.tag}
                </span>
              </div>

              <div className="p-4 border-t border-white/5 space-y-1">
                <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-snug">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🔥 QUOTES */}
      <section id="quotes" className="py-14 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#FF0080] px-3 py-1 rounded-full bg-[#FF0080]/10 border border-[#FF0080]/30">
            Discipline & Mindset
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white mt-2 sm:mt-3">Words That Fuel Greatness</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {motivationalQuotes.map((q, idx) => (
            <div key={idx} className="p-5 sm:p-6 rounded-3xl bg-[#0B0F19] border border-white/10 shadow-2xl relative flex flex-col justify-between group hover:border-[#FF0080]/50 transition-all">
              <span className="text-2xl sm:text-3xl text-[#FF0080] font-serif leading-none">“</span>
              <p className="text-xs sm:text-sm text-slate-300 font-medium italic leading-relaxed my-2 sm:my-3">{q.quote}</p>
              <div className="pt-3 border-t border-white/5">
                <h4 className="text-xs sm:text-sm font-bold text-white">{q.author}</h4>
                <span className="text-[9px] sm:text-[10px] text-[#00F2FE] font-semibold uppercase tracking-wider">{q.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 👑 FOUNDER */}
      <section id="founder" className="py-14 sm:py-16 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/10">
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-white/[0.04] to-white/[0.01] border border-white/15 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-3xl p-1 bg-gradient-to-tr from-[#00F2FE] via-[#7928CA] to-[#FF0080] shadow-[0_0_30px_rgba(0,242,254,0.3)]">
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-black">
                  <img src={founderImg} alt="Dinesh Reddy" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            <div className="md:col-span-8 space-y-3 sm:space-y-4 text-center md:text-left">
              <div>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#00F2FE]">Platform Founder & Visionary</span>
                <h3 className="text-xl sm:text-3xl font-black text-white mt-1">Dinesh Reddy</h3>
                <p className="text-[11px] sm:text-xs text-slate-400 font-mono">Lead Fitness Architect • Pulse Fit Ecosystem</p>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                "Pulse Fit was engineered out of the need for true operational clarity. As fitness professionals and gym owners, managing memberships, tracking uncollected dues, and maintaining high member retention shouldn't take hours of manual effort. Our platform equips facility leaders with automated digital tools so they can focus on what matters most: building stronger athletes."
              </p>

              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2.5 sm:gap-4 text-[10px] sm:text-xs font-bold font-mono text-[#00F2FE]">
                <span>✓ High-Performance Backend</span>
                <span>✓ QR Access Verification</span>
                <span>✓ Automated Dues Engine</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🦶 FOOTER */}
      <footer className="py-10 sm:py-12 px-4 sm:px-8 border-t border-white/10 bg-[#07090E] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-5 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-[#00F2FE] flex-shrink-0 bg-black">
              <img src={founderImg} alt="Dinesh Reddy" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-black text-white tracking-wider">PULSE FIT OS</span>
              <p className="text-[9px] sm:text-[10px] text-slate-400">Created & Founded by <strong className="text-[#00F2FE]">Dinesh Reddy</strong></p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-400 font-medium">
            <a href="#about" className="hover:text-[#00F2FE] transition-colors">About</a>
            <a href="#features" className="hover:text-[#00F2FE] transition-colors">Features</a>
            <a href="#showcase" className="hover:text-[#00F2FE] transition-colors">Facilities</a>
            <a href="#quotes" className="hover:text-[#00F2FE] transition-colors">Quotes</a>
            <button onClick={() => { setError(''); setSuccess(''); setActiveModal('login'); }} className="hover:text-[#00F2FE] transition-colors">Sign In</button>
          </div>

          <div className="text-center md:text-right text-[10px] sm:text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Pulse Fit Inc. All rights reserved.</p>
            <p className="text-[9px] sm:text-[10px] text-slate-600">Enterprise Fitness Management</p>
          </div>
        </div>
      </footer>

      {/* 🔐 MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className={`w-full ${activeModal === 'register' ? 'max-w-3xl' : 'max-w-md'} rounded-3xl overflow-hidden border border-white/20 bg-[#0B0F19] shadow-2xl p-5 sm:p-8 relative max-h-[90vh] overflow-y-auto my-auto`}>
            
            <button onClick={() => { setActiveModal(null); setError(''); setSuccess(''); }} className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg">
              ✕
            </button>

            {activeModal === 'login' && (
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">Sign In</h2>
                <p className="text-xs text-slate-400 mt-1 mb-5">Enter credentials to access your facility dashboard.</p>
                {error && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>}
                
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                    <input type="email" required className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" placeholder="owner@gym.com" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                      <button type="button" onClick={() => { setError(''); setSuccess(''); setForgotEmail(loginData.email || ''); setActiveModal('forgot'); }} className="text-xs text-[#00F2FE] hover:underline font-bold">
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input type={showLoginPassword ? 'text' : 'password'} required className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE] pr-12" placeholder="••••••••" value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} />
                      <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] font-bold">
                        {showLoginPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-2 hover:opacity-90 active:scale-95 shadow-lg shadow-cyan-500/20">
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>
                <p className="text-center text-slate-400 text-xs mt-4">
                  Need an account? <button onClick={() => { setError(''); setSuccess(''); setActiveModal('register'); }} className="text-[#00F2FE] font-bold hover:underline">Register Facility</button>
                </p>
              </div>
            )}

            {activeModal === 'forgot' && (
              <div>
                <h2 className="text-lg sm:text-xl font-black text-white">Reset Account Password</h2>
                <p className="text-xs text-slate-400 mt-1 mb-5">Enter your email to receive a secure password reset link.</p>
                {error && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>}
                {success && <div className="mb-4 text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">{success}</div>}

                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registered Email Address</label>
                    <input type="email" required className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" placeholder="owner@gym.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 shadow-lg">
                    {loading ? 'Dispatching Reset Link...' : 'Send Password Reset Link'}
                  </button>
                </form>
              </div>
            )}

            {activeModal === 'register' && (
              <div>
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] flex items-center justify-center text-white text-base">🏢</div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white">Gym Owner Registration</h2>
                    <p className="text-xs text-slate-400">Complete email OTP verification to activate credentials.</p>
                  </div>
                </div>

                {error && <div className="mb-4 text-xs p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{error}</div>}
                {success && <div className="mb-4 text-xs p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">{success}</div>}

                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/40 border border-white/10">
                    <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/20 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {registerData.gym_logo ? <img src={registerData.gym_logo} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-[10px] text-slate-500 font-bold">Logo</span>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Facility Logo *</label>
                      <input type="file" accept="image/*" required onChange={handleLogoUpload} className="text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gym / Brand Name *</label>
                      <input type="text" required placeholder="Iron Pulse Hub" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" value={registerData.gym_name} onChange={(e) => setRegisterData({ ...registerData, gym_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Owner Full Name *</label>
                      <input type="text" required placeholder="Dinesh Reddy" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} />
                    </div>

                    <div className="col-span-full sm:col-span-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Email *</label>
                      <div className="flex gap-2">
                        <input type="email" required placeholder="owner@gym.com" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} />
                        <button type="button" disabled={otpSending} onClick={handleSendRegisterOtp} className="px-3 py-2 rounded-xl bg-[#00F2FE]/20 border border-[#00F2FE]/40 text-[#00F2FE] hover:bg-[#00F2FE]/30 font-bold text-[10px] whitespace-nowrap">
                          {otpSending ? '...' : otpSent ? 'Resend' : 'Get OTP'}
                        </button>
                      </div>
                    </div>

                    <div className="col-span-full sm:col-span-1">
                      <label className="block text-[10px] font-bold text-[#00F2FE] uppercase mb-1">6-Digit Email OTP *</label>
                      <input type="text" required maxLength={6} placeholder="123456" className="w-full bg-black/40 border border-[#00F2FE]/40 px-3.5 py-2 rounded-xl text-xs text-white font-mono tracking-widest text-center outline-none" value={registerData.otp} onChange={(e) => setRegisterData({ ...registerData, otp: e.target.value })} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number *</label>
                      <input type="text" required placeholder="9876543210" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none focus:border-[#00F2FE]" value={registerData.phone} onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">City *</label>
                      <input type="text" required placeholder="Vadodara" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none" value={registerData.city} onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State *</label>
                      <input type="text" required placeholder="Gujarat" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none" value={registerData.state} onChange={(e) => setRegisterData({ ...registerData, state: e.target.value })} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pincode *</label>
                      <input type="text" required placeholder="390019" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none" value={registerData.pincode} onChange={(e) => setRegisterData({ ...registerData, pincode: e.target.value })} />
                    </div>

                    <div className="col-span-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Street Address *</label>
                      <textarea required rows={2} placeholder="Plot No. 42, Near Tech Park" className="w-full bg-black/40 border border-white/15 px-3.5 py-2 rounded-xl text-xs text-white outline-none" value={registerData.gym_address} onChange={(e) => setRegisterData({ ...registerData, gym_address: e.target.value })}></textarea>
                    </div>

                    <div className="col-span-full">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Password *</label>
                      <div className="relative">
                        <input type={showRegisterPassword ? 'text' : 'password'} required placeholder="••••••••" className="w-full bg-black/40 border border-white/15 px-3.5 py-2.5 rounded-xl text-xs text-white outline-none pr-12" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} />
                        <button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-bold">
                          {showRegisterPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00F2FE] to-[#7928CA] font-bold text-white text-xs uppercase tracking-wider mt-2 hover:opacity-90 active:scale-95 shadow-lg">
                    {loading ? 'Verifying OTP & Submitting...' : 'Verify Email & Complete Registration'}
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}