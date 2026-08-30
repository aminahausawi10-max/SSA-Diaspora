'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Shield, FileText, CheckCircle, AlertTriangle, Info, Clock, 
  MapPin, Phone, Mail, Award, Download, Printer, ExternalLink, 
  Search, Upload, ArrowRight, ArrowLeft, Send, Plus, Briefcase, 
  Globe, Radio, Volume2, Video, Eye, EyeOff, Lock
} from 'lucide-react';

export default function Home() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'register' | 'portal' | 'admin' | 'verify'>('home');
  
  // App Global State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userType, setUserType] = useState<'MEMBER' | 'STAFF' | null>(null);
  const [news, setNews] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalMembers: 0, pendingMembers: 0, verifiedMembers: 0, suspendedMembers: 0,
    newCases: 0, urgentCases: 0, underReview: 0, referred: 0, pendingResponse: 0, resolved: 0
  });

  // Registration Wizard State
  const [regStep, setRegStep] = useState(1);
  const [regData, setRegData] = useState({
    fullName: '', dob: '', gender: 'Male', photoBase64: '', photoPreview: '',
    stateOfOrigin: '', lga: '',
    nigerianStreet: '', nigerianCity: '', nigerianState: '', nigerianPhone: '',
    overseasCountry: 'United Kingdom', overseasState: '', overseasCity: '', overseasStreet: '', overseasPhone: '',
    passportNumber: '', ninNumber: '', documentBase64: '', documentPreview: '',
    email: '', password: '', emergencyNgName: '', emergencyNgRel: '', emergencyNgAddress: '', emergencyNgPhone: '',
    emergencyOsName: '', emergencyOsRel: '', emergencyOsAddress: '', emergencyOsPhone: ''
  });

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Issue Submission State
  const [caseCategory, setCaseCategory] = useState('Immigration');
  const [caseDescription, setCaseDescription] = useState('');
  const [casePhone, setCasePhone] = useState('');
  const [caseLocation, setCaseLocation] = useState('');
  const [caseMediaBase64, setCaseMediaBase64] = useState<string[]>([]);
  const [caseMediaPreviews, setCaseMediaPreviews] = useState<string[]>([]);
  const [caseIsUrgent, setCaseIsUrgent] = useState(false);
  const [caseCountry, setCaseCountry] = useState('United Kingdom');
  const [submittingCase, setSubmittingCase] = useState(false);
  const [successCaseNumber, setSuccessCaseNumber] = useState('');

  // Admin Selected Case State
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [referralAgency, setReferralAgency] = useState('NIS');
  const [referralNote, setReferralNote] = useState('');

  // ID Verification Search State
  const [searchId, setSearchId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verificationError, setVerificationError] = useState('');

  // Country Desk selection for Admin filtering
  const [selectedCountryDesk, setSelectedCountryDesk] = useState('All');

  // Load and refresh initial data
  const fetchData = async () => {
    try {
      const resNews = await fetch('/api/news');
      const dataNews = await resNews.json();
      if (dataNews.success) setNews(dataNews.news);

      const resMembers = await fetch('/api/members');
      const dataMembers = await resMembers.json();
      if (dataMembers.success) {
        setMembers(dataMembers.members);
        calculateStats(dataMembers.members, cases);
      }

      const resCases = await fetch('/api/cases');
      const dataCases = await resCases.json();
      if (dataCases.success) {
        setCases(dataCases.cases);
        calculateStats(members, dataCases.cases);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const calculateStats = (memberList: any[], caseList: any[]) => {
    const mems = memberList || [];
    const css = caseList || [];
    
    const statsObj = {
      totalMembers: mems.length,
      pendingMembers: mems.filter(m => m.status === 'PENDING').length,
      verifiedMembers: mems.filter(m => m.status === 'APPROVED').length,
      suspendedMembers: mems.filter(m => m.status === 'SUSPENDED').length,
      newCases: css.filter(c => c.status === 'SUBMITTED').length,
      urgentCases: css.filter(c => c.isUrgent).length,
      underReview: css.filter(c => c.status === 'UNDER REVIEW').length,
      referred: css.filter(c => c.status === 'REFERRED').length,
      pendingResponse: css.filter(c => c.status === 'AGENCY RESPONSE').length,
      resolved: css.filter(c => c.status === 'RESOLVED').length
    };
    setStats(statsObj);
  };

  useEffect(() => {
    fetchData();
    // Retrieve login session from localstorage if exists
    const storedUser = localStorage.getItem('ssa_user');
    const storedType = localStorage.getItem('ssa_usertype');
    if (storedUser && storedType) {
      setCurrentUser(JSON.parse(storedUser));
      setUserType(storedType as any);
    }
  }, []);

  useEffect(() => {
    calculateStats(members, cases);
  }, [members, cases]);

  // Handle file base64 conversions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'photo' | 'doc' | 'case') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      if (field === 'photo') {
        setRegData(prev => ({ ...prev, photoBase64: base64String, photoPreview: base64String }));
      } else if (field === 'doc') {
        setRegData(prev => ({ ...prev, documentBase64: base64String, documentPreview: base64String }));
      } else if (field === 'case') {
        setCaseMediaBase64(prev => [...prev, base64String]);
        setCaseMediaPreviews(prev => [...prev, base64String]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (data.success) {
        alert('Registration Successful! Your profile is pending verification.');
        // Log user in automatically
        setCurrentUser(data.member);
        setUserType('MEMBER');
        localStorage.setItem('ssa_user', JSON.stringify(data.member));
        localStorage.setItem('ssa_usertype', 'MEMBER');
        setActiveTab('portal');
        setRegStep(1);
        setRegData({
          fullName: '', dob: '', gender: 'Male', photoBase64: '', photoPreview: '',
          stateOfOrigin: '', lga: '',
          nigerianStreet: '', nigerianCity: '', nigerianState: '', nigerianPhone: '',
          overseasCountry: 'United Kingdom', overseasState: '', overseasCity: '', overseasStreet: '', overseasPhone: '',
          passportNumber: '', ninNumber: '', documentBase64: '', documentPreview: '',
          email: '', password: '', emergencyNgName: '', emergencyNgRel: '', emergencyNgAddress: '', emergencyNgPhone: '',
          emergencyOsName: '', emergencyOsRel: '', emergencyOsAddress: '', emergencyOsPhone: ''
        });
        fetchData();
      } else {
        alert(data.error || 'Registration failed.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred during registration.');
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setUserType(data.type);
        localStorage.setItem('ssa_user', JSON.stringify(data.user));
        localStorage.setItem('ssa_usertype', data.type);
        setLoginEmail('');
        setLoginPassword('');
        if (data.type === 'STAFF') {
          setActiveTab('admin');
        } else {
          setActiveTab('portal');
        }
        fetchData();
      } else {
        setLoginError(data.error || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Error connecting to authentication server.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserType(null);
    localStorage.removeItem('ssa_user');
    localStorage.removeItem('ssa_usertype');
    setActiveTab('home');
  };

  // Submit Issue
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmittingCase(true);
    setSuccessCaseNumber('');

    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: currentUser.account.email,
          memberName: currentUser.fullName,
          category: caseCategory,
          description: caseDescription,
          phoneNumber: casePhone,
          location: caseLocation,
          country: caseCountry,
          mediaBase64s: caseMediaBase64,
          isUrgent: caseIsUrgent
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessCaseNumber(data.case.caseNumber);
        setCaseDescription('');
        setCasePhone('');
        setCaseLocation('');
        setCaseMediaBase64([]);
        setCaseMediaPreviews([]);
        setCaseIsUrgent(false);
        fetchData();
      } else {
        alert(data.error || 'Failed to submit report.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting report.');
    } finally {
      setSubmittingCase(false);
    }
  };

  // Admin: Approve Member
  const handleApproveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to approve and generate a Diaspora ID for this member?')) return;
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, status: 'APPROVED' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Member Approved! Diaspora ID Generated.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Reject Member
  const handleRejectMember = async (memberId: string) => {
    const reason = prompt('Please enter the reason for rejection / corrections needed:');
    if (reason === null) return;
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, status: 'REJECTED' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Member status set to REJECTED.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Suspend Member
  const handleSuspendMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to suspend this member?')) return;
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, status: 'SUSPENDED' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Member status set to SUSPENDED.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Refer Case to Agency
  const handleReferCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;

    try {
      const res = await fetch('/api/cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCase.id,
          status: 'REFERRED',
          note: `Case referred to ${referralAgency}. ${referralNote}`,
          updatedBy: currentUser.fullName || 'Admin',
          referredAgency: referralAgency
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Case successfully referred to ${referralAgency}.`);
        setSelectedCase(data.case);
        setReferralNote('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Update Case Status
  const handleUpdateCaseStatus = async (caseId: string, newStatus: string, defaultNote: string) => {
    const note = prompt('Add progress comments/notes for this update:', defaultNote);
    if (note === null) return;
    try {
      const res = await fetch('/api/cases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: caseId,
          status: newStatus,
          note: note,
          updatedBy: currentUser.fullName || 'Admin'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Case status updated to ${newStatus}.`);
        if (selectedCase && selectedCase.id === caseId) {
          setSelectedCase(data.case);
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Public: Verify Diaspora ID
  const handleVerifyId = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    setVerificationResult(null);

    if (!searchId) return;
    try {
      // Find member matching diasporaId
      const match = members.find(m => m.diasporaId?.toUpperCase() === searchId.toUpperCase().trim());
      if (match) {
        setVerificationResult(match);
      } else {
        setVerificationError('No matching active Diaspora ID found. Please check spelling or verification status.');
      }
    } catch (err) {
      setVerificationError('Error connecting to validation engine.');
    }
  };

  // Trigger print view of Diaspora Card
  const handlePrintCard = () => {
    window.print();
  };

  // Simulated Download of Card
  const handleDownloadCard = () => {
    alert('Simulating PDF/Image download of ID Card...');
  };

  // Filter cases for country desks
  const getFilteredCases = () => {
    if (userType === 'STAFF' && currentUser?.role === 'COUNTRY_DESK_OFFICER') {
      return cases.filter(c => c.country.toLowerCase() === currentUser?.countryDesk?.toLowerCase());
    }
    if (selectedCountryDesk !== 'All') {
      return cases.filter(c => c.country.toLowerCase() === selectedCountryDesk.toLowerCase());
    }
    return cases;
  };

  return (
    <div className="pb-32 min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-white/50 px-6 py-4 shadow-sm flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">🇳🇬</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">SSA DIASPORA</h1>
            <p className="text-xs text-emerald-600 font-semibold">Presidential Support Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-slate-800">{currentUser.fullName}</p>
                <p className="text-xs font-medium text-slate-500">
                  {userType === 'STAFF' ? `${currentUser.role.replace('_', ' ')}` : 'Member'}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="clay-btn clay-btn-red text-xs px-4 py-2"
              >
                Log Out
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setActiveTab('portal')}
              className="clay-btn text-xs px-4 py-2"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* MAIN VIEW CONTENT CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 pt-8">
        
        {/* ==================== HOME TAB ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-10 no-print">
            {/* HERO HERO SECTION */}
            <div className="clay-card p-8 md:p-12 text-center space-y-6 max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-800 leading-tight">
                Empowering Nigerians <br />
                <span className="text-emerald-600">Across the Globe</span>
              </h2>
              <p className="text-slate-600 text-lg max-w-2xl mx-auto">
                Securely register online, claim your official Presidential Diaspora ID Card, request legal/welfare consular support, and interact directly with the Presidential Office.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button 
                  onClick={() => setActiveTab('register')}
                  className="clay-btn bg-emerald-600 clay-btn-green px-8 py-3.5 text-base flex items-center gap-2"
                >
                  <User size={18} /> Register Now
                </button>
                <button 
                  onClick={() => setActiveTab('verify')}
                  className="clay-btn bg-slate-700 clay-btn-grey px-8 py-3.5 text-base flex items-center gap-2"
                >
                  <Shield size={18} /> Verify Diaspora ID
                </button>
              </div>
            </div>

            {/* QUICK ACTIONS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="clay-card p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => setActiveTab('register')}>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <User size={24} />
                </div>
                <h3 className="font-bold text-slate-800">1. Online Register</h3>
                <p className="text-xs text-slate-500">6-step secure portal signup</p>
              </div>

              <div className="clay-card p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => setActiveTab('portal')}>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Award size={24} />
                </div>
                <h3 className="font-bold text-slate-800">2. Virtual ID Card</h3>
                <p className="text-xs text-slate-500">Downloadable & printable</p>
              </div>

              <div className="clay-card p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => {
                if (currentUser && userType === 'MEMBER') {
                  setActiveTab('portal');
                } else {
                  alert('Please sign in or register to submit case reports.');
                  setActiveTab('portal');
                }
              }}>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
                  <FileText size={24} />
                </div>
                <h3 className="font-bold text-slate-800">3. Report an Issue</h3>
                <p className="text-xs text-slate-500">Consular, legal, and welfare</p>
              </div>

              <div className="clay-card p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => setActiveTab('verify')}>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                  <Shield size={24} />
                </div>
                <h3 className="font-bold text-slate-800">4. QR Verification</h3>
                <p className="text-xs text-slate-500">Secure validation page</p>
              </div>
            </div>

            {/* EMERGENCY SYSTEM HIGHLIGHT */}
            <div className="clay-card bg-rose-50 border-rose-200/50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
                <div className="w-16 h-16 rounded-3xl bg-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-rose-800">EMERGENCY ASSISTANCE</h3>
                  <p className="text-rose-600 text-sm max-w-xl">
                    Are you a Nigerian abroad facing detention, emergency deportation, life-threatening security challenges, or trafficking? Report instantly to trigger an URGENT PRIORITY case response.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (!currentUser) {
                    alert('Please log in first to route your location/emergency coordinates correctly. Or contact our hotline directly.');
                    setActiveTab('portal');
                  } else {
                    setActiveTab('portal');
                    setCaseCategory('Emergency');
                    setCaseIsUrgent(true);
                  }
                }}
                className="clay-btn bg-rose-600 clay-btn-red text-white py-3.5 px-6 shrink-0 w-full md:w-auto"
              >
                Submit Emergency Report
              </button>
            </div>

            {/* ANNOUNCEMENTS & OFFICIAL DETAILS */}
            <div className="grid md:grid-cols-3 gap-8">
              {/* News */}
              <div className="clay-card p-6 md:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Radio className="text-emerald-600 animate-pulse" size={20} /> Latest Announcements
                </h3>
                <div className="space-y-4">
                  {news.length === 0 ? (
                    <p className="text-sm text-slate-500">No active announcements at the moment.</p>
                  ) : (
                    news.map((item) => (
                      <div key={item.id} className="clay-card-inner p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
                            {item.category}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800">{item.title}</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.content}</p>
                        <p className="text-xs text-slate-400 font-semibold">Author: {item.author}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Office Contact Info */}
              <div className="clay-card p-6 space-y-6">
                <h3 className="text-lg font-bold text-slate-800">Diaspora Coordination</h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex gap-3 items-start">
                    <MapPin className="text-slate-400 shrink-0 mt-1" size={18} />
                    <p>
                      SSA Diaspora Coordination Office,<br />
                      State House Villa, Abuja,<br />
                      FCT, Nigeria.
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Phone className="text-slate-400" size={18} />
                    <p>+234 908 765 4321 (Hotline)</p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Mail className="text-slate-400" size={18} />
                    <p>contact@ssa.gov.ng</p>
                  </div>
                  <hr className="border-slate-200/50" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs">Official Channels:</h4>
                    <p className="text-xs text-slate-500">
                      * WhatsApp Coordination: +234 908 765 4322<br />
                      * Video Appointments: Book via Member Portal.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== REGISTER TAB ==================== */}
        {activeTab === 'register' && (
          <div className="max-w-2xl mx-auto space-y-6 no-print">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Diaspora Membership Registration</h2>
              <p className="text-slate-500 text-sm">Provide correct details to claim your unique Diaspora ID card.</p>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-between items-center px-4">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                    regStep === num 
                      ? 'bg-blue-600 text-white shadow-lg scale-110' 
                      : regStep > num 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-white text-slate-400 border border-slate-200 shadow-inner'
                  }`}>
                    {num}
                  </div>
                  {num < 6 && (
                    <div className={`w-6 md:w-10 h-1 mx-1 rounded-full ${
                      regStep > num ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={handleRegister} className="clay-card p-6 md:p-8 space-y-6">
              
              {/* STEP 1: Personal Info */}
              {regStep === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 1 — Personal Information</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Full Name (as in Passport)</label>
                    <input 
                      type="text" required className="clay-input" placeholder="e.g. Amina Musa Bello"
                      value={regData.fullName} onChange={e => setRegData({...regData, fullName: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Date of Birth</label>
                      <input 
                        type="date" required className="clay-input"
                        value={regData.dob} onChange={e => setRegData({...regData, dob: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Gender</label>
                      <select 
                        className="clay-input" value={regData.gender}
                        onChange={e => setRegData({...regData, gender: e.target.value})}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">State of Origin</label>
                      <input 
                        type="text" required className="clay-input" placeholder="e.g. Kano"
                        value={regData.stateOfOrigin} onChange={e => setRegData({...regData, stateOfOrigin: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Local Government Area (LGA)</label>
                      <input 
                        type="text" required className="clay-input" placeholder="e.g. Fagge"
                        value={regData.lga} onChange={e => setRegData({...regData, lga: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600">Passport Photograph (JPG/PNG)</label>
                    <div className="flex items-center gap-4">
                      {regData.photoPreview && (
                        <img src={regData.photoPreview} className="w-16 h-16 rounded-xl object-cover border shadow-sm shrink-0" alt="Preview" />
                      )}
                      <label className="clay-btn bg-slate-100 clay-btn-grey text-slate-700 py-2 px-4 text-xs cursor-pointer">
                        <Upload size={14} className="mr-1" /> Select Photo
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'photo')} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Nigerian Address */}
              {regStep === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 2 — Nigerian Home Address</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">House Number / Street</label>
                    <input 
                      type="text" required className="clay-input" placeholder="e.g. 15 Gwarimpa Crescent"
                      value={regData.nigerianStreet} onChange={e => setRegData({...regData, nigerianStreet: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">City</label>
                      <input 
                        type="text" required className="clay-input" placeholder="Abuja"
                        value={regData.nigerianCity} onChange={e => setRegData({...regData, nigerianCity: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">State</label>
                      <input 
                        type="text" required className="clay-input" placeholder="FCT"
                        value={regData.nigerianState} onChange={e => setRegData({...regData, nigerianState: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Phone Number (Nigeria)</label>
                    <input 
                      type="tel" required className="clay-input" placeholder="+234 803 123 4567"
                      value={regData.nigerianPhone} onChange={e => setRegData({...regData, nigerianPhone: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: Current Overseas Address */}
              {regStep === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 3 — Current Overseas Residence</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Country of Residence</label>
                      <select 
                        className="clay-input" value={regData.overseasCountry}
                        onChange={e => setRegData({...regData, overseasCountry: e.target.value})}
                      >
                        <option>United Kingdom</option>
                        <option>United States</option>
                        <option>Saudi Arabia</option>
                        <option>United Arab Emirates</option>
                        <option>Canada</option>
                        <option>Germany</option>
                        <option>Turkey</option>
                        <option>South Africa</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">State / Province</label>
                      <input 
                        type="text" required className="clay-input" placeholder="e.g. London"
                        value={regData.overseasState} onChange={e => setRegData({...regData, overseasState: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">City</label>
                      <input 
                        type="text" required className="clay-input" placeholder="e.g. Croydon"
                        value={regData.overseasCity} onChange={e => setRegData({...regData, overseasCity: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Street / Full Address</label>
                      <input 
                        type="text" required className="clay-input" placeholder="e.g. 10 High Street"
                        value={regData.overseasStreet} onChange={e => setRegData({...regData, overseasStreet: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Phone Number (Overseas)</label>
                    <input 
                      type="tel" required className="clay-input" placeholder="+44 7911 123456"
                      value={regData.overseasPhone} onChange={e => setRegData({...regData, overseasPhone: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Identification */}
              {regStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 4 — National Identification</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Nigerian Passport Number</label>
                      <input 
                        type="text" required className="clay-input" placeholder="A00000000"
                        value={regData.passportNumber} onChange={e => setRegData({...regData, passportNumber: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">National Identification Number (NIN)</label>
                      <input 
                        type="text" required className="clay-input" placeholder="12345678901"
                        value={regData.ninNumber} onChange={e => setRegData({...regData, ninNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-slate-600">Upload Passport Data Page / ID Document (PDF/JPG)</label>
                    <div className="flex items-center gap-4">
                      {regData.documentPreview && (
                        <div className="w-16 h-16 rounded-xl border flex items-center justify-center bg-slate-100 shadow-sm shrink-0">
                          <FileText size={24} className="text-slate-500" />
                        </div>
                      )}
                      <label className="clay-btn bg-slate-100 clay-btn-grey text-slate-700 py-2 px-4 text-xs cursor-pointer">
                        <Upload size={14} className="mr-1" /> Select Document
                        <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handleFileChange(e, 'doc')} />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Account & Verification */}
              {regStep === 5 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 5 — Account Creation</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Email Address</label>
                    <input 
                      type="email" required className="clay-input" placeholder="you@example.com"
                      value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Password</label>
                    <input 
                      type="password" required className="clay-input" placeholder="••••••••"
                      value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})}
                    />
                  </div>

                  <div className="clay-card-inner p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700">Verification Simulations (MVP)</h4>
                    <p className="text-xs text-slate-500">
                      In the complete release, OTP code will be sent to confirm your email and phone. For this Phase 1 MVP, verification is simulated automatically upon submission.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" required className="mt-1" defaultChecked />
                    <span className="text-xs text-slate-500">
                      I consent to the Privacy Policy and agree to share my information with the Presidential Office for verified ID generation and coordination.
                    </span>
                  </label>
                </div>
              )}

              {/* STEP 6: Emergency Contacts */}
              {regStep === 6 && (
                <div className="space-y-5">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 6 — Emergency Contacts</h3>
                  
                  {/* Contact 1 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg">Emergency Contact 1 — Nigeria</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Name</label>
                        <input 
                          type="text" required className="clay-input" placeholder="John Ade"
                          value={regData.emergencyNgName} onChange={e => setRegData({...regData, emergencyNgName: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Relationship</label>
                        <input 
                          type="text" required className="clay-input" placeholder="Brother"
                          value={regData.emergencyNgRel} onChange={e => setRegData({...regData, emergencyNgRel: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Address</label>
                        <input 
                          type="text" required className="clay-input" placeholder="Ikeja, Lagos"
                          value={regData.emergencyNgAddress} onChange={e => setRegData({...regData, emergencyNgAddress: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Phone Number</label>
                        <input 
                          type="tel" required className="clay-input" placeholder="+234 80..."
                          value={regData.emergencyNgPhone} onChange={e => setRegData({...regData, emergencyNgPhone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact 2 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg">Emergency Contact 2 — Country of Residence</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Name</label>
                        <input 
                          type="text" required className="clay-input" placeholder="Sarah Smith"
                          value={regData.emergencyOsName} onChange={e => setRegData({...regData, emergencyOsName: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Relationship</label>
                        <input 
                          type="text" required className="clay-input" placeholder="Spouse"
                          value={regData.emergencyOsRel} onChange={e => setRegData({...regData, emergencyOsRel: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Address</label>
                        <input 
                          type="text" required className="clay-input" placeholder="London, UK"
                          value={regData.emergencyOsAddress} onChange={e => setRegData({...regData, emergencyOsAddress: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Phone Number</label>
                        <input 
                          type="tel" required className="clay-input" placeholder="+44 79..."
                          value={regData.emergencyOsPhone} onChange={e => setRegData({...regData, emergencyOsPhone: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Nav buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                {regStep > 1 ? (
                  <button 
                    type="button" onClick={() => setRegStep(regStep - 1)}
                    className="clay-btn clay-btn-grey px-5 py-2.5 text-xs flex items-center gap-1"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {regStep < 6 ? (
                  <button 
                    type="button" onClick={() => setRegStep(regStep + 1)}
                    className="clay-btn px-6 py-2.5 text-xs flex items-center gap-1"
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button 
                    type="submit"
                    className="clay-btn clay-btn-green px-8 py-2.5 text-xs flex items-center gap-1 text-white"
                  >
                    Submit Registration <CheckCircle size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* ==================== MEMBER PORTAL / LOGIN TAB ==================== */}
        {activeTab === 'portal' && (
          <div className="space-y-8">
            
            {/* IF NOT LOGGED IN */}
            {!currentUser && (
              <div className="max-w-md mx-auto space-y-6 no-print">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-slate-800">Sign In to Dashboard</h2>
                  <p className="text-sm text-slate-500">Access your virtual card, track reported issues, or view staff desk.</p>
                </div>

                <form onSubmit={handleLogin} className="clay-card p-6 md:p-8 space-y-5">
                  {loginError && (
                    <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-200 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {loginError}
                    </div>
                  )}

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Email Address</label>
                    <input 
                      type="email" required className="clay-input" placeholder="name@domain.com"
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1 relative">
                    <label className="text-xs font-bold text-slate-600">Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} required className="clay-input" placeholder="••••••••"
                      value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    />
                    <button 
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <button type="submit" className="clay-btn w-full py-3">
                    Sign In <Lock size={16} className="ml-1" />
                  </button>

                  <div className="text-center pt-2">
                    <p className="text-xs text-slate-500">
                      Don't have an account?{' '}
                      <span className="text-blue-600 font-semibold cursor-pointer" onClick={() => setActiveTab('register')}>
                        Register as Member
                      </span>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* IF LOGGED IN AS STAFF */}
            {currentUser && userType === 'STAFF' && (
              <div className="clay-card p-6 text-center space-y-4 no-print">
                <Shield size={48} className="text-emerald-600 mx-auto" />
                <h3 className="text-xl font-bold text-slate-800">Authenticated Staff Session</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  You are signed in as a staff member with role <strong className="text-emerald-700">{currentUser.role.replace('_', ' ')}</strong>. Please use the Admin Panel to perform official reviews.
                </p>
                <button 
                  onClick={() => setActiveTab('admin')}
                  className="clay-btn bg-emerald-600 clay-btn-green py-2 px-6 text-sm"
                >
                  Go to Admin Panel
                </button>
              </div>
            )}

            {/* IF LOGGED IN AS DIASPORA MEMBER */}
            {currentUser && userType === 'MEMBER' && (
              <div className="space-y-10">
                
                {/* Profile Overview and Virtual Card */}
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  
                  {/* Virtual ID Card View */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 no-print">
                      <Award size={20} className="text-emerald-600" /> Virtual ID Card
                    </h3>
                    
                    {/* The Card Container */}
                    <div className="id-card-clay id-card-print-wrap p-6 max-w-md mx-auto relative overflow-hidden flex flex-col justify-between h-72 text-slate-800">
                      {/* Flag and Coat of Arms background */}
                      <div className="absolute inset-0 bg-no-repeat bg-right-bottom opacity-10 pointer-events-none" style={{ backgroundImage: `url('https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/nigeria_map.png')` }} />
                      
                      {/* Top Header */}
                      <div className="flex justify-between items-start border-b border-slate-200/50 pb-3">
                        <div className="flex gap-2 items-center">
                          <span className="text-2xl">🇳🇬</span>
                          <div>
                            <h4 className="text-sm font-bold tracking-wider text-slate-800 leading-tight">SSA DIASPORA</h4>
                            <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-tight">Presidential Support Platform</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            currentUser.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {currentUser.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Body details */}
                      <div className="flex gap-4 items-center my-auto">
                        {/* Photograph */}
                        <img 
                          src={currentUser.photoUrl || 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png'} 
                          className="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-inner bg-slate-100" 
                          alt="Photo" 
                        />
                        
                        {/* Information Details */}
                        <div className="space-y-1 text-xs">
                          <p className="font-bold text-sm tracking-tight text-slate-900">{currentUser.fullName}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">
                            ID: <strong className="text-slate-800 font-bold">{currentUser.diasporaId || 'PENDING VERIFICATION'}</strong>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Country: <strong className="text-slate-700">{currentUser.overseasAddress.country}</strong>
                          </p>
                          <p className="text-[10px] text-slate-500">
                            State of Origin: <strong className="text-slate-700">{currentUser.stateOfOrigin}</strong>
                          </p>
                          {currentUser.issueDate && (
                            <p className="text-[9px] text-slate-400">
                              Issued: {currentUser.issueDate}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer & QR Code */}
                      <div className="flex justify-between items-end border-t border-slate-200/50 pt-3">
                        <span className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">
                          Official Digital Membership Card
                        </span>
                        
                        {/* Dynamic QR Code link */}
                        <div className="w-12 h-12 bg-white p-1 rounded-lg shadow-inner">
                          {currentUser.diasporaId ? (
                            <img 
                              src={`https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent('https://ssa-diaspora.vercel.app/verify?id=' + currentUser.diasporaId)}`} 
                              className="w-full h-full" 
                              alt="QR" 
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center"><Clock size={12} className="text-slate-400" /></div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex justify-center gap-3 no-print">
                      <button onClick={handlePrintCard} className="clay-btn bg-emerald-600 clay-btn-green px-4 py-2 text-xs flex items-center gap-1">
                        <Printer size={14} /> Print ID
                      </button>
                      <button onClick={handleDownloadCard} className="clay-btn bg-blue-600 px-4 py-2 text-xs flex items-center gap-1">
                        <Download size={14} /> Download ID
                      </button>
                    </div>
                  </div>

                  {/* Account overview profile details */}
                  <div className="clay-card p-6 space-y-4 no-print">
                    <h3 className="text-lg font-bold text-slate-800">Profile Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400">Email Address</p>
                        <p className="font-bold text-slate-700">{currentUser.account.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">DOB & Gender</p>
                        <p className="font-bold text-slate-700">{currentUser.dob} ({currentUser.gender})</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Overseas Phone</p>
                        <p className="font-bold text-slate-700">{currentUser.overseasAddress.phone}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Passport Number</p>
                        <p className="font-bold text-slate-700">••••{currentUser.identification.passportNumber.slice(-4)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-400">Overseas Address</p>
                        <p className="font-bold text-slate-700">
                          {currentUser.overseasAddress.street}, {currentUser.overseasAddress.city}, {currentUser.overseasAddress.state}, {currentUser.overseasAddress.country}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Issue / My Cases Section */}
                <div className="grid md:grid-cols-2 gap-8 items-start no-print">
                  
                  {/* Issue Form */}
                  <div className="clay-card p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Report an Issue</h3>
                    
                    {successCaseNumber && (
                      <div className="bg-emerald-50 text-emerald-800 text-xs p-4 rounded-xl border border-emerald-200 space-y-1">
                        <p className="font-bold">Case Submitted Successfully!</p>
                        <p>Your Case Tracking ID: <strong>{successCaseNumber}</strong></p>
                      </div>
                    )}

                    <form onSubmit={handleReportIssue} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-600">Category</label>
                          <select 
                            className="clay-input" value={caseCategory}
                            onChange={e => setCaseCategory(e.target.value)}
                          >
                            <option>Immigration</option>
                            <option>Documentation</option>
                            <option>Labour</option>
                            <option>Security</option>
                            <option>Human Trafficking</option>
                            <option>Welfare</option>
                            <option>Consular Matters</option>
                            <option>Legal Matters</option>
                            <option>Community Issues</option>
                            <option>Emergency</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-600">Country of occurrence</label>
                          <input 
                            type="text" className="clay-input" placeholder="e.g. United Kingdom"
                            value={caseCountry} onChange={e => setCaseCountry(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-600">Direct Phone Contact</label>
                          <input 
                            type="tel" className="clay-input" placeholder="+44 79..."
                            value={casePhone} onChange={e => setCasePhone(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-600">Specific Location (Optional)</label>
                          <input 
                            type="text" className="clay-input" placeholder="City or airport"
                            value={caseLocation} onChange={e => setCaseLocation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Description of Issue</label>
                        <textarea 
                          required rows={3} className="clay-input" placeholder="Provide full details..."
                          value={caseDescription} onChange={e => setCaseDescription(e.target.value)}
                        />
                      </div>

                      {/* Attachments */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-slate-600">Attach Voice, Video, Photos or Documents</label>
                        <div className="flex flex-wrap gap-2 items-center">
                          <label className="clay-btn bg-slate-100 clay-btn-grey text-slate-700 py-2 px-3 text-xs cursor-pointer">
                            <Upload size={12} className="mr-1" /> Add File
                            <input type="file" accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={e => handleFileChange(e, 'case')} />
                          </label>
                          <span className="text-[10px] text-slate-400">({caseMediaPreviews.length} files attached)</span>
                        </div>

                        {caseMediaPreviews.length > 0 && (
                          <div className="flex gap-2 flex-wrap pt-2">
                            {caseMediaPreviews.map((preview, i) => (
                              <div key={i} className="relative w-12 h-12 rounded-lg border overflow-hidden shadow-sm bg-slate-100 flex items-center justify-center">
                                {preview.startsWith('data:image/') ? (
                                  <img src={preview} className="w-full h-full object-cover" />
                                ) : preview.startsWith('data:audio/') ? (
                                  <Volume2 size={18} className="text-blue-500" />
                                ) : preview.startsWith('data:video/') ? (
                                  <Video size={18} className="text-red-500" />
                                ) : (
                                  <FileText size={18} className="text-slate-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" id="urgent" checked={caseIsUrgent}
                          onChange={e => setCaseIsUrgent(e.target.checked)}
                        />
                        <label htmlFor="urgent" className="text-xs font-bold text-rose-700 cursor-pointer flex items-center gap-1">
                          <AlertTriangle size={14} /> Flag as Urgent Case
                        </label>
                      </div>

                      <button type="submit" disabled={submittingCase} className="clay-btn bg-emerald-600 clay-btn-green w-full py-2.5">
                        {submittingCase ? 'Submitting...' : 'Submit Report'} <Send size={14} className="ml-1" />
                      </button>
                    </form>
                  </div>

                  {/* My Cases List */}
                  <div className="clay-card p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">My Case Reports</h3>
                    
                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                      {cases.filter(c => c.memberId === currentUser.account.email).length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">You haven't submitted any cases yet.</p>
                      ) : (
                        cases
                          .filter(c => c.memberId === currentUser.account.email)
                          .map((item) => (
                            <div key={item.id} className="clay-card-inner p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                                    {item.caseNumber}
                                  </span>
                                  <h4 className="font-bold text-slate-800 text-sm mt-1">{item.category}</h4>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                                  item.status === 'REFERRED' ? 'bg-amber-100 text-amber-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-2">{item.description}</p>
                              
                              {item.referredAgency && (
                                <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                                  Referred Agency Desk: {item.referredAgency}
                                </div>
                              )}

                              {/* Progress pipeline */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] text-slate-400 font-bold uppercase">
                                  <span>Submitted</span>
                                  <span>Referred</span>
                                  <span>Resolved</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className={`h-full bg-emerald-500 transition-all ${
                                    item.status === 'RESOLVED' ? 'w-full' :
                                    item.status === 'ACTION TAKEN' ? 'w-5/6' :
                                    item.status === 'AGENCY RESPONSE' ? 'w-4/6' :
                                    item.status === 'REFERRED' ? 'w-3/6' :
                                    item.status === 'UNDER REVIEW' ? 'w-2/6' : 'w-1/6'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== ADMIN TAB ==================== */}
        {activeTab === 'admin' && (
          <div className="space-y-8 no-print">
            
            {/* Staff Authenticated View Gate */}
            {(!currentUser || userType !== 'STAFF') ? (
              <div className="max-w-md mx-auto text-center space-y-4">
                <Shield size={48} className="text-red-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-800">Admin Section Restricted</h3>
                <p className="text-sm text-slate-500">Authorized personnel only. Please sign in with your staff account.</p>
                <button onClick={() => setActiveTab('portal')} className="clay-btn px-6 py-2.5">
                  Staff Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="clay-card p-4 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Members</span>
                    <p className="text-2xl font-black text-slate-800">{stats.totalMembers}</p>
                    <span className="text-[10px] text-amber-600 font-bold">{stats.pendingMembers} pending verification</span>
                  </div>
                  <div className="clay-card p-4 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Verified Members</span>
                    <p className="text-2xl font-black text-emerald-600">{stats.verifiedMembers}</p>
                    <span className="text-[10px] text-slate-500 font-semibold">Active virtual cards</span>
                  </div>
                  <div className="clay-card p-4 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Active Cases</span>
                    <p className="text-2xl font-black text-blue-600">
                      {cases.filter(c => c.status !== 'RESOLVED').length}
                    </p>
                    <span className="text-[10px] text-red-600 font-bold">{stats.urgentCases} flagged urgent</span>
                  </div>
                  <div className="clay-card p-4 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Resolved Cases</span>
                    <p className="text-2xl font-black text-emerald-600">{stats.resolved}</p>
                    <span className="text-[10px] text-slate-500 font-semibold">Coordination closed</span>
                  </div>
                </div>

                {/* Country Desks stats and filters */}
                <div className="clay-card p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-blue-600" />
                    <span className="text-sm font-bold text-slate-700">Country Desk Filter:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'United Kingdom', 'United States', 'Saudi Arabia', 'United Arab Emirates', 'Canada', 'Germany', 'Turkey'].map((desk) => (
                      <button 
                        key={desk} 
                        onClick={() => setSelectedCountryDesk(desk)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          selectedCountryDesk === desk 
                            ? 'bg-blue-600 text-white shadow-inner' 
                            : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        {desk} ({cases.filter(c => desk === 'All' ? true : c.country.toLowerCase() === desk.toLowerCase()).length})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Members Verification Section */}
                <div className="grid lg:grid-cols-2 gap-8">
                  
                  {/* Pending Registrations list */}
                  <div className="clay-card p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Clock className="text-amber-500" size={18} /> Pending Member Approvals ({members.filter(m => m.status === 'PENDING').length})
                    </h3>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {members.filter(m => m.status === 'PENDING').length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-12">No registrations pending verification.</p>
                      ) : (
                        members
                          .filter(m => m.status === 'PENDING')
                          .map((m) => (
                            <div key={m.id} className="clay-card-inner p-4 space-y-3">
                              <div className="flex gap-3 items-center">
                                <img src={m.photoUrl} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                <div>
                                  <h4 className="font-bold text-slate-800 text-sm">{m.fullName}</h4>
                                  <p className="text-[10px] text-slate-500">{m.account.email} | Country: {m.overseasAddress.country}</p>
                                </div>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded text-[10px] space-y-1 text-slate-600">
                                <p><strong>Passport:</strong> {m.identification.passportNumber} | <strong>NIN:</strong> {m.identification.ninNumber}</p>
                                <p><strong>Origin:</strong> {m.stateOfOrigin} State | <strong>LGA:</strong> {m.lga}</p>
                              </div>

                              {m.identification.documentUrl && (
                                <a 
                                  href={m.identification.documentUrl} target="_blank" rel="noreferrer"
                                  className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  <FileText size={12} /> View Uploaded Verification Document <ExternalLink size={10} />
                                </a>
                              )}

                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => handleRejectMember(m.id)}
                                  className="clay-btn clay-btn-red text-[10px] px-3 py-1.5"
                                >
                                  Reject / Corrections
                                </button>
                                <button 
                                  onClick={() => handleApproveMember(m.id)}
                                  className="clay-btn bg-emerald-600 clay-btn-green text-[10px] px-3 py-1.5"
                                >
                                  Approve & Generate ID
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                  {/* Active Verified Members list */}
                  <div className="clay-card p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle className="text-emerald-500" size={18} /> Verified Members ({members.filter(m => m.status === 'APPROVED').length})
                    </h3>

                    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                      {members.filter(m => m.status === 'APPROVED').length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-12">No verified members registered.</p>
                      ) : (
                        members
                          .filter(m => m.status === 'APPROVED')
                          .map((m) => (
                            <div key={m.id} className="clay-card-inner p-3 flex justify-between items-center gap-3">
                              <div className="flex gap-3 items-center">
                                <img src={m.photoUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                <div>
                                  <h4 className="font-bold text-slate-800 text-xs">{m.fullName}</h4>
                                  <p className="text-[10px] text-slate-400">ID: {m.diasporaId} | {m.overseasAddress.country}</p>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleSuspendMember(m.id)}
                                className="clay-btn clay-btn-red text-[9px] px-2.5 py-1"
                              >
                                Suspend Card
                              </button>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Cases Referral Section */}
                <div className="grid lg:grid-cols-3 gap-8">
                  
                  {/* Cases list */}
                  <div className="clay-card p-6 lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">
                      Diaspora Issues Desk ({getFilteredCases().length})
                    </h3>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {getFilteredCases().length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-12">No issues reported matching selection.</p>
                      ) : (
                        getFilteredCases().map((c) => (
                          <div 
                            key={c.id} 
                            onClick={() => setSelectedCase(c)}
                            className={`clay-card-inner p-4 space-y-3 cursor-pointer hover:border-blue-300 transition-all ${
                              selectedCase?.id === c.id ? 'border-2 border-blue-400 bg-blue-50/20' : ''
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                                  c.isUrgent ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {c.isUrgent ? 'URGENT PRIORITY' : 'NORMAL'}
                                </span>
                                <h4 className="font-bold text-slate-800 text-sm mt-1">{c.caseNumber} - {c.category}</h4>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                                c.status === 'REFERRED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {c.status}
                              </span>
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2">{c.description}</p>
                            
                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span>Country: {c.country}</span>
                              <span>By: {c.memberName}</span>
                            </div>

                            {c.referredAgency && (
                              <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                                Assigned Referral: {c.referredAgency}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Case Referral Assignment details */}
                  <div className="clay-card p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800">Case Coordinator</h3>

                    {selectedCase ? (
                      <div className="space-y-4 text-xs">
                        <div className="border-b pb-2">
                          <p className="font-bold text-slate-800">{selectedCase.caseNumber}</p>
                          <p className="text-slate-500">Category: {selectedCase.category}</p>
                          <p className="text-slate-500 font-semibold mt-1">Country: {selectedCase.country}</p>
                          <p className="text-slate-600 mt-2 bg-slate-50 p-2 rounded max-h-24 overflow-y-auto">{selectedCase.description}</p>
                        </div>

                        {/* Attachments */}
                        {selectedCase.mediaUrls && selectedCase.mediaUrls.length > 0 && (
                          <div className="space-y-1">
                            <p className="font-bold text-slate-700">Uploaded Evidence:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedCase.mediaUrls.map((url: string, index: number) => (
                                <a 
                                  key={index} href={url} target="_blank" rel="noreferrer"
                                  className="p-1 rounded bg-slate-100 border text-[10px] text-blue-600 flex items-center gap-1 hover:underline"
                                >
                                  File {index + 1} <ExternalLink size={10} />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action status modification */}
                        <div className="space-y-2">
                          <p className="font-bold text-slate-700">Status Control:</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateCaseStatus(selectedCase.id, 'UNDER REVIEW', 'Reviewing member documentation...')}
                              className="clay-btn bg-slate-200 clay-btn-grey text-[9px] py-1.5 px-3 flex-1"
                            >
                              Review
                            </button>
                            <button 
                              onClick={() => handleUpdateCaseStatus(selectedCase.id, 'RESOLVED', 'Issue successfully coordinated and closed.')}
                              className="clay-btn bg-emerald-600 clay-btn-green text-[9px] py-1.5 px-3 flex-1 text-white"
                            >
                              Resolve / Close
                            </button>
                          </div>
                        </div>

                        {/* Agency referral form */}
                        <form onSubmit={handleReferCase} className="space-y-3 border-t pt-3">
                          <p className="font-bold text-slate-700">Refer to Government Agency:</p>
                          
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500">Statutory Institution</label>
                            <select 
                              className="clay-input text-xs" value={referralAgency}
                              onChange={e => setReferralAgency(e.target.value)}
                            >
                              <option value="NAPTIP">NAPTIP (Human Trafficking)</option>
                              <option value="NIS">Nigeria Immigration Service</option>
                              <option value="NiDCOM">NiDCOM (Diaspora Coordination)</option>
                              <option value="MFA">Ministry of Foreign Affairs / Embassy</option>
                              <option value="FMLE">Federal Ministry of Labour & Employment</option>
                              <option value="NAPTIP">Appropriate Security Agency</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-500">Instructions / Notes</label>
                            <textarea 
                              rows={2} required className="clay-input text-xs" 
                              placeholder="Describe referral context..."
                              value={referralNote} onChange={e => setReferralNote(e.target.value)}
                            />
                          </div>

                          <button type="submit" className="clay-btn bg-blue-600 w-full py-2 text-xs">
                            Assign Agency Referral
                          </button>
                        </form>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs text-center py-16">Select a case from the desk to manage referrals.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== ID VERIFY / QR TAB ==================== */}
        {activeTab === 'verify' && (
          <div className="max-w-md mx-auto space-y-6 no-print">
            <div className="text-center space-y-2">
              <Shield size={40} className="text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-bold text-slate-800">Secure Diaspora Verification</h2>
              <p className="text-sm text-slate-500">Public validation desk. Enter a Diaspora ID Number to verify its status.</p>
            </div>

            <form onSubmit={handleVerifyId} className="clay-card p-6 space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-600">Diaspora ID Number</label>
                <div className="flex gap-2">
                  <input 
                    type="text" required className="clay-input flex-1" placeholder="e.g. SSA-DIA-2026-000001"
                    value={searchId} onChange={e => setSearchId(e.target.value)}
                  />
                  <button type="submit" className="clay-btn px-4">
                    <Search size={16} />
                  </button>
                </div>
              </div>

              {verificationError && (
                <p className="text-rose-600 text-xs font-semibold bg-rose-50 p-3 rounded-lg border border-rose-100">{verificationError}</p>
              )}

              {/* Verified Result Card */}
              {verificationResult && (
                <div className="clay-card-inner p-4 space-y-4 bg-emerald-50/20">
                  <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                    <CheckCircle className="text-emerald-600" size={24} />
                    <div>
                      <h4 className="font-bold text-emerald-800 text-sm">AUTHENTIC DIASPORA ID</h4>
                      <p className="text-[10px] text-slate-500">Verification check passed.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <img src={verificationResult.photoUrl} className="w-14 h-14 rounded-lg object-cover bg-slate-100" />
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-800">{verificationResult.fullName}</p>
                      <p className="text-[10px] text-slate-500">Diaspora ID: <strong>{verificationResult.diasporaId}</strong></p>
                      <p className="text-[10px] text-slate-500">Country: <strong>{verificationResult.overseasAddress.country}</strong></p>
                      <p className="text-[10px] text-slate-500">Status: <strong className="text-emerald-600 uppercase font-bold">{verificationResult.status}</strong></p>
                    </div>
                  </div>

                  <div className="bg-amber-50 text-amber-800 text-[9px] p-2.5 rounded-lg border border-amber-200">
                    <strong>Notice:</strong> In compliance with Nigerian Data Protection Laws, sensitive personal information (including NIN, passport details, and specific addresses) is hidden from public lookup.
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* ==================== STICKY BUTTON NAVIGATION ==================== */}
      <div className="sticky-nav-container no-print">
        <nav className="sticky-nav">
          <button 
            onClick={() => setActiveTab('home')}
            className={`sticky-nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          >
            <Globe size={18} />
            <span>Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('register')}
            className={`sticky-nav-btn ${activeTab === 'register' ? 'active' : ''}`}
          >
            <Plus size={18} />
            <span>Register</span>
          </button>

          <button 
            onClick={() => setActiveTab('portal')}
            className={`sticky-nav-btn ${activeTab === 'portal' ? 'active' : ''}`}
          >
            <User size={18} />
            <span>Portal</span>
          </button>

          {userType === 'STAFF' && (
            <button 
              onClick={() => setActiveTab('admin')}
              className={`sticky-nav-btn ${activeTab === 'admin' ? 'active' : ''}`}
            >
              <Briefcase size={18} />
              <span>Admin</span>
            </button>
          )}

          <button 
            onClick={() => setActiveTab('verify')}
            className={`sticky-nav-btn ${activeTab === 'verify' ? 'active' : ''}`}
          >
            <Shield size={18} />
            <span>Verify</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
