'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Shield, FileText, CheckCircle, AlertTriangle, Info, Clock, 
  MapPin, Phone, Mail, Award, Download, Printer, ExternalLink, 
  Search, Upload, ArrowRight, ArrowLeft, Send, Plus, Briefcase, 
  Globe, Radio, Volume2, Video, Eye, EyeOff, Lock, Edit, Trash2, UserPlus, UserMinus, RefreshCw, Bell, BellRing,
  PhoneCall, RotateCw
} from 'lucide-react';

export const SUPPORTED_COUNTRIES = [
  'Bahrain',
  'Egypt',
  'Jordan',
  'Kuwait',
  'Oman',
  'Qatar',
  'Saudi Arabia',
  'Sudan',
  'United Arab Emirates (UAE)',
  'Angola',
  'Benin Republic',
  'Cameroon',
  'Central African Republic',
  "Côte d'Ivoire",
  'Ethiopia',
  'Gambia',
  'Ghana',
  'Kenya',
  'Mali',
  'Niger Republic',
  'Senegal',
  'South Africa',
  'Tanzania',
  'Togo',
  'Uganda',
  'Bangladesh',
  'Canada',
  'China',
  'Cyprus',
  'France',
  'Germany',
  'India',
  'Italy',
  'Malaysia',
  'Pakistan',
  'Singapore',
  'Spain',
  'Thailand',
  'United Kingdom (UK)',
  'United States of America (USA)'
];

export const formatDiasporaId = (id?: string | null): string => {
  if (!id) return '';
  const trimmed = id.trim().toUpperCase();
  if (trimmed.startsWith('SSA-DIA-') || trimmed.startsWith('SSA-')) {
    const parts = trimmed.split('-');
    const seq = parts[parts.length - 1];
    return `NIG-DIA-${seq}`;
  }
  return trimmed;
};

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

  // Diaspora ID Portal Access State
  const [showDiasporaIdModal, setShowDiasporaIdModal] = useState(false);
  const [inputDiasporaId, setInputDiasporaId] = useState('');
  const [diasporaIdError, setDiasporaIdError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [cardSide, setCardSide] = useState<'FRONT' | 'BACK'>('FRONT');

  // Admin Manual Adjustments State
  const [manualAdjustment, setManualAdjustment] = useState({
    category: 'Total Members',
    amount: '1',
    reason: ''
  });
  const [customOffsets, setCustomOffsets] = useState<{ [key: string]: number }>({
    'Total Members': 0,
    'Verified Members': 0,
    'Active Cases': 0,
    'Resolved Cases': 0,
    'Total Submissions': 0,
    'New (Received)': 0,
    'Processing Cases': 0,
    'Completed': 0
  });

  // Load and refresh initial data
  const fetchData = async () => {
    try {
      let currentOffsets = { ...customOffsets };
      const storedOffsets = typeof window !== 'undefined' ? localStorage.getItem('ssa_custom_offsets') : null;
      if (storedOffsets) {
        try {
          currentOffsets = { ...currentOffsets, ...JSON.parse(storedOffsets) };
        } catch (e) {}
      }

      try {
        const resStats = await fetch('/api/stats');
        const dataStats = await resStats.json();
        if (dataStats.success && dataStats.offsets && Object.keys(dataStats.offsets).length > 0) {
          currentOffsets = { ...currentOffsets, ...dataStats.offsets };
        }
      } catch (e) {
        console.warn('Could not fetch server stats offsets:', e);
      }

      setCustomOffsets(currentOffsets);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ssa_custom_offsets', JSON.stringify(currentOffsets));
      }

      const resNews = await fetch('/api/news');
      const dataNews = await resNews.json();
      if (dataNews.success) setNews(dataNews.news);

      let fetchedMembers: any[] = members;
      const resMembers = await fetch('/api/members');
      const dataMembers = await resMembers.json();
      if (dataMembers.success) {
        fetchedMembers = (dataMembers.members || []).map((m: any) => ({
          ...m,
          diasporaId: formatDiasporaId(m.diasporaId)
        }));
        setMembers(fetchedMembers);

        // Auto-refresh currentUser if logged in so cached ID is immediately updated to NIG-DIA-xxxxxx
        setCurrentUser((prev: any) => {
          if (!prev) return null;
          const fresh = fetchedMembers.find((m: any) => 
            m.id === prev.id || 
            m.account?.email?.toLowerCase() === (prev.account?.email || prev.email)?.toLowerCase()
          );
          if (fresh) {
            const updated = { ...prev, ...fresh, diasporaId: formatDiasporaId(fresh.diasporaId || prev.diasporaId) };
            localStorage.setItem('ssa_user', JSON.stringify(updated));
            return updated;
          }
          if (prev.diasporaId) {
            const updated = { ...prev, diasporaId: formatDiasporaId(prev.diasporaId) };
            localStorage.setItem('ssa_user', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
      }

      let fetchedCases: any[] = cases;
      const resCases = await fetch('/api/cases');
      const dataCases = await resCases.json();
      if (dataCases.success) {
        fetchedCases = dataCases.cases || [];
        setCases(fetchedCases);
      }

      calculateStats(fetchedMembers, fetchedCases, currentOffsets);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const calculateStats = (memberList: any[], caseList: any[], offsets?: { [key: string]: number }) => {
    const mems = memberList || [];
    const css = caseList || [];
    const currentOffsets = offsets || customOffsets;
    
    const baseTotalMembers = mems.length;
    const baseVerified = mems.filter(m => m.status === 'APPROVED').length;
    const baseCases = css.filter(c => c.status !== 'RESOLVED').length;
    const baseResolved = css.filter(c => c.status === 'RESOLVED').length;

    const totalMembersOffset = currentOffsets['Total Members'] || currentOffsets['Total Submissions'] || 0;
    const verifiedOffset = currentOffsets['Verified Members'] || currentOffsets['Completed'] || 0;
    const activeCasesOffset = currentOffsets['Active Cases'] || currentOffsets['Processing Cases'] || 0;
    const newReceivedOffset = currentOffsets['New (Received)'] || 0;
    const resolvedOffset = currentOffsets['Resolved Cases'] || 0;

    const statsObj = {
      totalMembers: Math.max(0, baseTotalMembers + totalMembersOffset),
      pendingMembers: mems.filter(m => m.status === 'PENDING').length + (newReceivedOffset),
      verifiedMembers: Math.max(0, baseVerified + verifiedOffset),
      suspendedMembers: mems.filter(m => m.status === 'SUSPENDED').length,
      activeCases: Math.max(0, baseCases + activeCasesOffset),
      newCases: css.filter(c => c.status === 'SUBMITTED').length + (newReceivedOffset),
      urgentCases: css.filter(c => c.isUrgent).length,
      underReview: css.filter(c => c.status === 'UNDER REVIEW').length,
      referred: css.filter(c => c.status === 'REFERRED').length,
      pendingResponse: css.filter(c => c.status === 'AGENCY RESPONSE').length,
      resolved: Math.max(0, baseResolved + resolvedOffset),
      totalCases: Math.max(0, css.length + activeCasesOffset + resolvedOffset)
    };
    setStats(statsObj);
  };

  useEffect(() => {
    fetchData();
    // Retrieve custom offsets from localstorage if exists
    const storedOffsets = localStorage.getItem('ssa_custom_offsets');
    if (storedOffsets) {
      try {
        setCustomOffsets(JSON.parse(storedOffsets));
      } catch (e) {
        console.error(e);
      }
    }
    // Retrieve login session from localstorage if exists
    const storedUser = localStorage.getItem('ssa_user');
    const storedType = localStorage.getItem('ssa_usertype');
    if (storedUser && storedType) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.diasporaId) {
          parsed.diasporaId = formatDiasporaId(parsed.diasporaId);
          localStorage.setItem('ssa_user', JSON.stringify(parsed));
        }
        if (storedType === 'STAFF' || parsed.isRegistered) {
          setCurrentUser(parsed);
          setUserType(storedType as any);
        } else {
          localStorage.removeItem('ssa_user');
          localStorage.removeItem('ssa_usertype');
        }
      } catch (e) {
        localStorage.removeItem('ssa_user');
        localStorage.removeItem('ssa_usertype');
      }
    }
  }, []);

  useEffect(() => {
    calculateStats(members, cases);
  }, [members, cases, customOffsets]);

  // Real-time Auto-refresh for Member Approval & Virtual Card generation (for Members)
  useEffect(() => {
    if (!currentUser || userType !== 'MEMBER' || !currentUser.isRegistered || currentUser.status === 'APPROVED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/members');
        const data = await res.json();
        if (data.success && data.members) {
          const fresh = data.members.find((m: any) => 
            m.id === currentUser.id || 
            m.account?.email?.toLowerCase() === (currentUser.account?.email || currentUser.email)?.toLowerCase() ||
            (currentUser.diasporaId && m.diasporaId?.toUpperCase() === currentUser.diasporaId?.toUpperCase())
          );
          if (fresh && fresh.status === 'APPROVED') {
            const approvedUser = { ...fresh, isRegistered: true };
            setCurrentUser(approvedUser);
            localStorage.setItem('ssa_user', JSON.stringify(approvedUser));
            fetchData();
          }
        }
      } catch (err) {
        console.error('Auto status check error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, userType]);

  // Real-time Auto-polling for Admin Panel (Fetches new registrations automatically every 4s)
  useEffect(() => {
    if (!currentUser || userType !== 'STAFF') {
      return;
    }

    const adminInterval = setInterval(() => {
      fetchData();
    }, 4000);

    return () => clearInterval(adminInterval);
  }, [currentUser, userType]);

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
    if (!regData.fullName?.trim() || !regData.email?.trim()) {
      alert('Please provide your Full Name and Email Address.');
      return;
    }

    if (!regData.emergencyNgName?.trim() && !regData.emergencyOsName?.trim()) {
      alert('Emergency Contact is compulsory. Please enter the full name of your emergency contact person.');
      setRegStep(6);
      return;
    }

    if (!regData.emergencyNgPhone?.trim() && !regData.emergencyOsPhone?.trim()) {
      alert('Emergency Contact Phone Number is compulsory. Please provide their phone number.');
      setRegStep(6);
      return;
    }

    setIsSubmittingReg(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (data.success) {
        // Log user in automatically to their portal
        const newMember = { ...data.member, isRegistered: true };
        setCurrentUser(newMember);
        setUserType('MEMBER');
        localStorage.setItem('ssa_user', JSON.stringify(newMember));
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
        await fetchData();
      } else {
        alert(data.error || 'Registration failed. Please verify your details.');
      }
    } catch (err: any) {
      console.error(err);
      alert('An error occurred during registration: ' + (err.message || 'Network error'));
    } finally {
      setIsSubmittingReg(false);
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
        
        const enteredEmail = loginEmail;
        const enteredPassword = loginPassword;
        setLoginEmail('');
        setLoginPassword('');

        if (data.type === 'STAFF') {
          setActiveTab('admin');
        } else if (data.isNew || !data.user.identification?.passportNumber || data.user.fullName === 'Diaspora Member') {
          // Open registration form pre-filled with email & password to complete required details
          setRegData(prev => ({
            ...prev,
            fullName: (data.user.fullName && data.user.fullName !== 'Diaspora Member') ? data.user.fullName : '',
            email: data.user.account?.email || enteredEmail,
            password: enteredPassword
          }));
          setRegStep(1);
          setActiveTab('register');
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

  // Admin: Approve Member automatically without manually typing ID
  const handleApproveMember = async (memberId: string, customDiasporaId?: string) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: memberId, 
          status: 'APPROVED', 
          ...(customDiasporaId?.trim() ? { diasporaId: customDiasporaId.trim() } : {}) 
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Member Approved! Diaspora ID: ${(data.member?.diasporaId || customDiasporaId || '').toUpperCase()}`);
        fetchData();
      } else {
        alert(data.error || 'Failed to approve member.');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating member verification.');
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

  // Admin: Unsuspend / Restore Member
  const handleUnsuspendMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to unsuspend this member and reactivate their Diaspora ID?')) return;
    try {
      const res = await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId, status: 'APPROVED' })
      });
      const data = await res.json();
      if (data.success) {
        alert('Member has been successfully unsuspended and reactivated.');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Admin: Delete / Remove Member Permanently
  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to permanently remove member "${memberName}" from the system? This action cannot be undone.`)) return;
    try {
      const res = await fetch('/api/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: memberId })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Member "${memberName}" has been permanently removed.`);
        fetchData();
      } else {
        alert(data.error || 'Failed to remove member.');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing member.');
    }
  };

  // Admin: Manual Count Adjustment (Add / Remove)
  const handleApplyAdjustment = async (action: 'ADD' | 'REMOVE') => {
    const qty = parseInt(manualAdjustment.amount, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid amount greater than 0.');
      return;
    }

    const cat = manualAdjustment.category;
    const currentOffset = customOffsets[cat] || 0;
    const newOffset = action === 'ADD' ? currentOffset + qty : Math.max(0, currentOffset - qty);

    const updatedOffsets = {
      ...customOffsets,
      [cat]: newOffset
    };

    setCustomOffsets(updatedOffsets);
    localStorage.setItem('ssa_custom_offsets', JSON.stringify(updatedOffsets));
    calculateStats(members, cases, updatedOffsets);

    try {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offsets: updatedOffsets })
      });
    } catch (e) {
      console.warn('Could not save offsets to server:', e);
    }

    alert(`${action === 'ADD' ? 'Added' : 'Removed'} ${qty} for "${cat}". Total updated successfully!`);
  };

  // Admin: Set Exact Count for Category
  const handleSetExactCount = async () => {
    const targetVal = parseInt(manualAdjustment.amount, 10);
    if (isNaN(targetVal) || targetVal < 0) {
      alert('Please enter a valid amount greater than or equal to 0.');
      return;
    }

    const cat = manualAdjustment.category;
    let baseCount = 0;
    if (cat === 'Total Members' || cat === 'Total Submissions') baseCount = members.length;
    else if (cat === 'Verified Members' || cat === 'Completed') baseCount = members.filter(m => m.status === 'APPROVED').length;
    else if (cat === 'Active Cases' || cat === 'Processing Cases') baseCount = cases.filter(c => c.status !== 'RESOLVED').length;
    else if (cat === 'Resolved Cases') baseCount = cases.filter(c => c.status === 'RESOLVED').length;
    else if (cat === 'New (Received)') baseCount = members.filter(m => m.status === 'PENDING').length;

    const newOffset = Math.max(0, targetVal - baseCount);
    const updatedOffsets = {
      ...customOffsets,
      [cat]: newOffset
    };

    setCustomOffsets(updatedOffsets);
    localStorage.setItem('ssa_custom_offsets', JSON.stringify(updatedOffsets));
    calculateStats(members, cases, updatedOffsets);

    try {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offsets: updatedOffsets })
      });
    } catch (e) {
      console.warn('Could not save offsets to server:', e);
    }

    alert(`"${cat}" count set to ${targetVal}. Updated successfully!`);
  };

  // Admin: Reset all manual count adjustments
  const handleResetOffsets = async () => {
    if (!confirm('Are you sure you want to reset all manual adjustment numbers to 0 (real database counts)?')) return;
    const cleanOffsets = {
      'Total Members': 0,
      'Verified Members': 0,
      'Active Cases': 0,
      'Resolved Cases': 0,
      'Total Submissions': 0,
      'New (Received)': 0,
      'Processing Cases': 0,
      'Completed': 0
    };
    setCustomOffsets(cleanOffsets);
    localStorage.setItem('ssa_custom_offsets', JSON.stringify(cleanOffsets));
    calculateStats(members, cases, cleanOffsets);
    try {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offsets: cleanOffsets })
      });
    } catch (e) {
      console.warn(e);
    }
    alert('All manual adjustment counts have been reset to real database values.');
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

  // Diaspora ID Direct Portal Access
  const handleDiasporaIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiasporaIdError('');
    if (!inputDiasporaId.trim()) return;

    try {
      const cleanId = inputDiasporaId.trim().toUpperCase();
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.success && data.members) {
        const found = data.members.find((m: any) => 
          m.diasporaId?.toUpperCase() === cleanId ||
          (currentUser && m.account?.email?.toLowerCase() === (currentUser.account?.email || currentUser.email)?.toLowerCase())
        );

        if (found) {
          // If member is found, attach the submitted diasporaId if needed
          let userObj = { ...found, isRegistered: true };
          if (!userObj.diasporaId || userObj.diasporaId !== cleanId) {
            userObj.diasporaId = cleanId;
            await fetch('/api/members', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: found.id, diasporaId: cleanId, status: found.status || 'PENDING' })
            });
          }

          setCurrentUser(userObj);
          setUserType('MEMBER');
          localStorage.setItem('ssa_user', JSON.stringify(userObj));
          localStorage.setItem('ssa_usertype', 'MEMBER');
          setShowDiasporaIdModal(false);
          setInputDiasporaId('');
          setActiveTab('portal');
          fetchData();
        } else if (currentUser) {
          // Link this Diaspora ID to the signed-in user
          const updated = { ...currentUser, diasporaId: cleanId, status: 'PENDING', isRegistered: true };
          await fetch('/api/members', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser.id, diasporaId: cleanId, status: 'PENDING' })
          });
          setCurrentUser(updated);
          setUserType('MEMBER');
          localStorage.setItem('ssa_user', JSON.stringify(updated));
          localStorage.setItem('ssa_usertype', 'MEMBER');
          setShowDiasporaIdModal(false);
          setInputDiasporaId('');
          setActiveTab('portal');
          fetchData();
        } else {
          setDiasporaIdError('No account found matching this Diaspora ID. Please sign in with your email first or complete the registration below.');
        }
      } else {
        setDiasporaIdError('Unable to connect to verification server.');
      }
    } catch (err) {
      console.error(err);
      setDiasporaIdError('Error verifying Diaspora ID.');
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

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      if (currentUser?.id) {
        try {
          const res = await fetch('/api/members', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: currentUser.id, photoBase64: base64 })
          });
          const data = await res.json();
          if (data.success) {
            alert('Profile picture updated successfully!');
            setCurrentUser(data.member);
            localStorage.setItem('ssa_user', JSON.stringify(data.member));
            fetchData();
          } else {
            alert(data.error || 'Failed to update profile picture.');
          }
        } catch (err) {
          console.error(err);
          alert('Error uploading picture.');
        }
      }
    };
    reader.readAsDataURL(file);
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
      <header className="sticky top-0 z-40 w-full bg-white/85 backdrop-blur-xl border-b border-emerald-100/80 px-6 py-4 shadow-sm flex items-center justify-between no-print">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img src="/logo.png" className="w-12 h-12 object-contain rounded-2xl shadow-md p-0.5 bg-gradient-to-br from-white to-emerald-50 border border-emerald-200" alt="SSA Diaspora Logo" />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">✓</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900">SSA DIASPORA</h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 hidden sm:inline-block">Official</span>
            </div>
            <p className="text-xs text-emerald-700 font-bold tracking-tight">Diaspora Platform • Federal Republic of Nigeria</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              {userType === 'STAFF' && (
                <button 
                  onClick={() => setActiveTab('admin')}
                  className="clay-btn bg-emerald-600 clay-btn-green text-white text-xs px-3.5 py-2 flex items-center gap-1.5 font-bold shadow-md"
                >
                  <Briefcase size={14} /> Admin Dashboard
                </button>
              )}

              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-900">
                  {userType === 'STAFF' 
                    ? currentUser.fullName 
                    : (currentUser.isRegistered ? currentUser.fullName : (currentUser.account?.email || currentUser.email))}
                </p>
                <p className="text-xs font-semibold text-emerald-700">
                  {userType === 'STAFF' 
                    ? `${currentUser.role.replace('_', ' ')}` 
                    : (currentUser.isRegistered ? 'Verified Diaspora Member' : 'Pending Registration')}
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
              className="clay-btn clay-btn-green text-xs px-5 py-2 font-bold text-white shadow-md"
            >
              Sign In / Member Portal
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
            <div className="clay-card p-8 md:p-12 text-center space-y-6 max-w-4xl mx-auto relative overflow-hidden">
              {/* Subtle top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600"></div>
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Diaspora Support & Identification Platform
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                Empowering Nigerians <br />
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">Across the Globe</span>
              </h2>
              <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
                Securely register online, claim your verified Diaspora Membership ID Card, access rapid consular/welfare support, and connect directly with the Diaspora Coordination Office.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 pt-2">
                <button 
                  onClick={() => setActiveTab('register')}
                  className="clay-btn bg-emerald-600 clay-btn-green px-8 py-3.5 text-base flex items-center gap-2 font-bold shadow-lg"
                >
                  <User size={18} /> Register Now
                </button>
                <button 
                  onClick={() => setActiveTab('verify')}
                  className="clay-btn clay-btn-blue px-8 py-3.5 text-base flex items-center gap-2 font-bold shadow-lg"
                >
                  <Shield size={18} /> Verify Diaspora ID
                </button>
                <button 
                  onClick={() => setActiveTab('portal')}
                  className="clay-btn clay-btn-gold px-8 py-3.5 text-base flex items-center gap-2 font-bold shadow-lg"
                >
                  <Award size={18} /> Member Portal
                </button>
              </div>
            </div>

            {/* LIVE PLATFORM METRICS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="clay-card clay-card-emerald p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Registered</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                    <User size={16} />
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-900">{stats.totalMembers}</p>
                <span className="text-[11px] text-emerald-700 font-bold block">Nigerians Worldwide</span>
              </div>

              <div className="clay-card clay-card-blue p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Verified IDs</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-200/60 text-blue-800 flex items-center justify-center font-bold">
                    <Shield size={16} />
                  </div>
                </div>
                <p className="text-3xl font-black text-blue-900">{stats.verifiedMembers}</p>
                <span className="text-[11px] text-blue-700 font-bold block">Active Digital Cards</span>
              </div>

              <div className="clay-card clay-card-amber p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Country Desks</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold">
                    <Globe size={16} />
                  </div>
                </div>
                <p className="text-3xl font-black text-amber-900">{SUPPORTED_COUNTRIES.length}</p>
                <span className="text-[11px] text-amber-700 font-bold block">Global Missions Covered</span>
              </div>

              <div className="clay-card clay-card-purple p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">Cases Assisted</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-200/60 text-purple-800 flex items-center justify-center font-bold">
                    <FileText size={16} />
                  </div>
                </div>
                <p className="text-3xl font-black text-purple-900">{stats.totalCases}</p>
                <span className="text-[11px] text-purple-700 font-bold block">Consular & Welfare Handled</span>
              </div>
            </div>

            {/* QUICK ACTIONS GRID (Vibrant Multi-Color Cards) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="clay-card clay-card-emerald p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1.5 transition-all shadow-md" onClick={() => setActiveTab('register')}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/25">
                  <User size={26} />
                </div>
                <h3 className="font-extrabold text-slate-900">Online Register</h3>
                <p className="text-xs text-slate-600 font-medium">6-step secure portal signup</p>
              </div>

              <div className="clay-card clay-card-blue p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1.5 transition-all shadow-md" onClick={() => setActiveTab('portal')}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
                  <Award size={26} />
                </div>
                <h3 className="font-extrabold text-slate-900">Virtual ID Card</h3>
                <p className="text-xs text-slate-600 font-medium">Downloadable & printable</p>
              </div>

              <div className="clay-card clay-card-amber p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1.5 transition-all shadow-md" onClick={() => {
                if (currentUser && userType === 'MEMBER') {
                  setActiveTab('portal');
                } else {
                  alert('Please sign in or register to submit case reports.');
                  setActiveTab('portal');
                }
              }}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/25">
                  <FileText size={26} />
                </div>
                <h3 className="font-extrabold text-slate-900">Report an Issue</h3>
                <p className="text-xs text-slate-600 font-medium">Consular, legal, & welfare</p>
              </div>

              <div className="clay-card clay-card-purple p-6 text-center space-y-3 cursor-pointer hover:-translate-y-1.5 transition-all shadow-md" onClick={() => setActiveTab('verify')}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/25">
                  <Shield size={26} />
                </div>
                <h3 className="font-extrabold text-slate-900">QR Verification</h3>
                <p className="text-xs text-slate-600 font-medium">Secure validation engine</p>
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
                      Wuse Zone 5, Abuja,<br />
                      Federal Capital Territory of Nigeria.
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Phone className="text-emerald-600 shrink-0" size={18} />
                    <p className="font-bold text-slate-800">07047000070 <span className="text-xs font-normal text-slate-500">(+234 704 700 0070)</span></p>
                  </div>
                  <div className="flex gap-3 items-center">
                    <Mail className="text-slate-400 shrink-0" size={18} />
                    <p>contact@ssa.gov.ng</p>
                  </div>
                  <hr className="border-slate-200/50" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs">Official Channels:</h4>
                    <p className="text-xs text-slate-500">
                      * Direct Helpline & WhatsApp: <strong>07047000070</strong><br />
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
                      ? 'bg-emerald-600 text-white shadow-lg scale-110' 
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
                    <label className="text-xs font-bold text-slate-600">Full Name (as in Passport) *</label>
                    <input 
                      type="text" required className="clay-input" placeholder="e.g. Amina Musa Bello"
                      value={regData.fullName} onChange={e => setRegData({...regData, fullName: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Date of Birth</label>
                      <input 
                        type="date" className="clay-input"
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
                        type="text" className="clay-input" placeholder="e.g. Kano"
                        value={regData.stateOfOrigin} onChange={e => setRegData({...regData, stateOfOrigin: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Local Government Area (LGA)</label>
                      <input 
                        type="text" className="clay-input" placeholder="e.g. Fagge"
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
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 2 — Nigerian Home Address (Optional)</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">House Number / Street</label>
                    <input 
                      type="text" className="clay-input" placeholder="e.g. 15 Gwarimpa Crescent"
                      value={regData.nigerianStreet} onChange={e => setRegData({...regData, nigerianStreet: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">City</label>
                      <input 
                        type="text" className="clay-input" placeholder="Abuja"
                        value={regData.nigerianCity} onChange={e => setRegData({...regData, nigerianCity: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">State</label>
                      <input 
                        type="text" className="clay-input" placeholder="FCT"
                        value={regData.nigerianState} onChange={e => setRegData({...regData, nigerianState: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Phone Number (Nigeria)</label>
                    <input 
                      type="tel" className="clay-input" placeholder="+234 803 123 4567"
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
                      <label className="text-xs font-bold text-slate-600">Country of Residence *</label>
                      <select 
                        className="clay-input font-medium" value={regData.overseasCountry}
                        onChange={e => setRegData({...regData, overseasCountry: e.target.value})}
                      >
                        {SUPPORTED_COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">State / Province</label>
                      <input 
                        type="text" className="clay-input" placeholder="e.g. London"
                        value={regData.overseasState} onChange={e => setRegData({...regData, overseasState: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">City</label>
                      <input 
                        type="text" className="clay-input" placeholder="e.g. Croydon"
                        value={regData.overseasCity} onChange={e => setRegData({...regData, overseasCity: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Street / Full Address</label>
                      <input 
                        type="text" className="clay-input" placeholder="e.g. 10 High Street"
                        value={regData.overseasStreet} onChange={e => setRegData({...regData, overseasStreet: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Phone Number (Overseas)</label>
                    <input 
                      type="tel" className="clay-input" placeholder="+44 7911 123456"
                      value={regData.overseasPhone} onChange={e => setRegData({...regData, overseasPhone: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: Identification */}
              {regStep === 4 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 4 — National Identification (Optional)</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">Nigerian Passport Number</label>
                      <input 
                        type="text" className="clay-input" placeholder="A00000000"
                        value={regData.passportNumber} onChange={e => setRegData({...regData, passportNumber: e.target.value})}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-slate-600">National Identification Number (NIN)</label>
                      <input 
                        type="text" className="clay-input" placeholder="12345678901"
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
                  <h3 className="font-bold text-slate-800 border-b pb-2">Step 5 — Official Email & Contact</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-600">Official Email Address *</label>
                    <input 
                      type="email" required className="clay-input" placeholder="you@example.com"
                      value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})}
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Your official Diaspora ID and verification updates will be communicated via this email.</p>
                  </div>

                  <div className="clay-card-inner p-4 space-y-2 bg-emerald-50/40 border-emerald-200">
                    <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Shield size={14} className="text-emerald-600" /> Direct Diaspora Portal Access
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      No password required. Once submitted, your registration will be sent to the Diaspora Coordination Office for approval. Your Virtual Card and Diaspora ID will automatically generate upon approval.
                    </p>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" required className="mt-1" defaultChecked />
                    <span className="text-xs text-slate-500">
                      I consent to the Privacy Policy and agree to share my information with the Diaspora Coordination Office for verified ID generation and coordination.
                    </span>
                  </label>
                </div>
              )}

              {/* STEP 6: Emergency Contacts */}
              {regStep === 6 && (
                <div className="space-y-5">
                  <div className="border-b pb-2 flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                    <h3 className="font-bold text-slate-800">Step 6 — Emergency Contacts</h3>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 w-fit">
                      * Compulsory / Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Please provide at least one active emergency contact person. This information is compulsory and is displayed on the back of your official Diaspora Membership ID Card.
                  </p>
                  
                  {/* Contact 1 */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                      <span>Emergency Contact 1 (Nigeria or Primary) *</span>
                      <span className="text-[10px] text-emerald-700 font-semibold">Required</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Name *</label>
                        <input 
                          type="text" required className="clay-input" placeholder="e.g. John Ade"
                          value={regData.emergencyNgName} onChange={e => setRegData({...regData, emergencyNgName: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Relationship *</label>
                        <input 
                          type="text" required className="clay-input" placeholder="e.g. Brother / Sister / Spouse"
                          value={regData.emergencyNgRel} onChange={e => setRegData({...regData, emergencyNgRel: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Phone Number *</label>
                        <input 
                          type="tel" required className="clay-input font-mono" placeholder="e.g. +234 801 234 5678"
                          value={regData.emergencyNgPhone} onChange={e => setRegData({...regData, emergencyNgPhone: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Address</label>
                        <input 
                          type="text" className="clay-input" placeholder="e.g. Ikeja, Lagos"
                          value={regData.emergencyNgAddress} onChange={e => setRegData({...regData, emergencyNgAddress: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact 2 */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                      <span>Emergency Contact 2 (Country of Residence / Overseas)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Optional</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Name</label>
                        <input 
                          type="text" className="clay-input" placeholder="e.g. Sarah Smith"
                          value={regData.emergencyOsName} onChange={e => setRegData({...regData, emergencyOsName: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Relationship</label>
                        <input 
                          type="text" className="clay-input" placeholder="e.g. Spouse / Colleague"
                          value={regData.emergencyOsRel} onChange={e => setRegData({...regData, emergencyOsRel: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Phone Number</label>
                        <input 
                          type="tel" className="clay-input font-mono" placeholder="e.g. +44 791 234 5678"
                          value={regData.emergencyOsPhone} onChange={e => setRegData({...regData, emergencyOsPhone: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-600">Full Address</label>
                        <input 
                          type="text" className="clay-input" placeholder="e.g. London, UK"
                          value={regData.emergencyOsAddress} onChange={e => setRegData({...regData, emergencyOsAddress: e.target.value})}
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
                    disabled={isSubmittingReg}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                ) : (
                  <div />
                )}

                {regStep < 5 && (
                  <button 
                    type="button" onClick={() => setRegStep(regStep + 1)}
                    className="clay-btn px-6 py-2.5 text-xs flex items-center gap-1"
                    disabled={isSubmittingReg}
                  >
                    Next <ArrowRight size={14} />
                  </button>
                )}

                {regStep === 5 && (
                  <button 
                    type="button" onClick={() => setRegStep(6)}
                    className="clay-btn clay-btn-green px-6 py-2.5 text-xs flex items-center gap-1 text-white font-bold"
                    disabled={isSubmittingReg}
                  >
                    Next: Emergency Contacts (Required) <ArrowRight size={14} />
                  </button>
                )}

                {regStep === 6 && (
                  <button 
                    type="submit"
                    disabled={isSubmittingReg}
                    className="clay-btn clay-btn-green px-8 py-2.5 text-xs flex items-center gap-1 text-white font-bold"
                  >
                    {isSubmittingReg ? 'Submitting...' : 'Submit Registration'} <CheckCircle size={14} />
                  </button>
                )}
              </div>
            </form>

            {/* Already Registered? Diaspora ID Access Section */}
            <div className="clay-card p-5 text-center space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span className="text-xs text-slate-500">Already completed your registration?</span>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowDiasporaIdModal(!showDiasporaIdModal);
                    setDiasporaIdError('');
                  }}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline flex items-center gap-1"
                >
                  <Award size={14} /> Already Registered? Enter Diaspora ID
                </button>
              </div>

              {showDiasporaIdModal && (
                <div className="clay-card-inner p-5 space-y-4 border border-emerald-300 bg-emerald-50/40 text-left">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                      <Shield size={16} className="text-emerald-600" /> Enter Your Diaspora ID to Access Portal
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter your generated Diaspora ID number below to unlock and enter your Member Portal directly:
                    </p>
                  </div>

                  {diasporaIdError && (
                    <div className="bg-rose-50 text-rose-700 text-xs p-3 rounded-lg border border-rose-200">
                      {diasporaIdError}
                    </div>
                  )}

                  <form onSubmit={handleDiasporaIdLogin} className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      required 
                      className="clay-input flex-1 text-xs uppercase" 
                      placeholder="e.g. NIG-DIA-000001"
                      value={inputDiasporaId} 
                      onChange={e => setInputDiasporaId(e.target.value)}
                    />
                    <button type="submit" className="clay-btn bg-emerald-600 clay-btn-green px-5 py-2 text-xs text-white whitespace-nowrap">
                      Access Portal <ArrowRight size={14} className="ml-1" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== MEMBER PORTAL / LOGIN TAB ==================== */}
        {activeTab === 'portal' && (
          <div className="space-y-8">
            
            {/* IF NOT LOGGED IN */}
            {!currentUser && (
              <div className="max-w-md mx-auto space-y-6 no-print">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-sm">
                    <Shield size={13} className="text-emerald-600" /> Official Member Portal Access
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Sign In to Dashboard</h2>
                  <p className="text-xs md:text-sm text-slate-500 font-medium">Access your digital card, consular assistance, and verified records.</p>
                </div>

                <form onSubmit={handleLogin} className="clay-card clay-card-emerald p-6 md:p-8 space-y-5 relative overflow-hidden shadow-xl">
                  {/* Top Accent Line */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

                  {loginError && (
                    <div className="bg-rose-50 text-rose-800 text-xs p-3.5 rounded-xl border border-rose-200 flex items-center gap-2.5 shadow-sm">
                      <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                      <span className="font-semibold">{loginError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black text-slate-700">Official Email Address</label>
                    <input 
                      type="email" required className="clay-input font-bold" placeholder="name@domain.com"
                      value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 relative">
                    <label className="text-xs font-black text-slate-700">Password / Access Key</label>
                    <input 
                      type={showPassword ? "text" : "password"} required className="clay-input font-mono font-bold" placeholder="••••••••"
                      value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                    />
                    <button 
                      type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-9 text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>

                  <button type="submit" className="clay-btn bg-emerald-600 clay-btn-green w-full py-3.5 text-sm font-black text-white shadow-lg flex items-center justify-center gap-2">
                    Sign In to Portal <Lock size={16} />
                  </button>

                  <div className="text-center pt-2 border-t border-emerald-100">
                    <p className="text-xs text-slate-500">
                      Don't have an account yet?{' '}
                      <span className="text-emerald-700 font-extrabold cursor-pointer hover:underline" onClick={() => setActiveTab('register')}>
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

            {/* IF LOGGED IN AS DIASPORA MEMBER BUT REGISTRATION NOT COMPLETED */}
            {currentUser && userType === 'MEMBER' && !currentUser.isRegistered && (
              <div className="clay-card p-8 text-center space-y-5 max-w-lg mx-auto no-print">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <User size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">Complete Your Registration</h3>
                  <p className="text-sm text-slate-500">
                    Welcome! You are signed in with <strong>{currentUser.account?.email || currentUser.email}</strong>. Your profile details, Virtual ID card, and case reporting will become visible as soon as you submit your registration details.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setRegData(prev => ({
                      ...prev,
                      email: currentUser.account?.email || currentUser.email || '',
                      password: ''
                    }));
                    setRegStep(1);
                    setActiveTab('register');
                  }}
                  className="clay-btn bg-emerald-600 clay-btn-green py-3 px-8 text-sm text-white"
                >
                  Fill Registration Form Now <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
            )}

            {/* IF LOGGED IN AND SUBMITTED ID / REGISTERED BUT STILL PENDING ADMIN VERIFICATION (or REJECTED or unknown status) */}
            {currentUser && userType === 'MEMBER' && currentUser.isRegistered && !['APPROVED', 'SUSPENDED'].includes(currentUser.status) && (
              <div className="clay-card p-8 md:p-12 text-center space-y-6 max-w-xl mx-auto no-print border-2 border-amber-300 bg-amber-50/50 shadow-xl rounded-3xl animate-in fade-in zoom-in-95">
                <div className="w-20 h-20 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
                  <Clock size={42} />
                </div>
                
                <div className="space-y-3">
                  <span className="inline-block bg-amber-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                    Registration Submitted — Awaiting Approval
                  </span>
                  <h3 className="text-2xl font-black text-slate-800">Registration Complete, Please Wait for Approval</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Thank you, <strong>{currentUser.fullName}</strong>. Your diaspora registration has been successfully submitted and is now awaiting official approval from the Diaspora Coordination Office.
                  </p>
                  
                  <div className="bg-white p-5 rounded-2xl border border-amber-200 text-xs text-slate-600 space-y-3 text-left shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-800 border-b pb-2">
                      <CheckCircle size={16} className="text-emerald-600" />
                      <span>Automatic Virtual Card Generation</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      As soon as the Administrator approves your registration, your <strong>Official Virtual Diaspora ID Card</strong> and <strong>Unique Diaspora Number</strong> will automatically create and activate on this screen in real-time.
                    </p>
                    <p className="text-slate-400 text-[11px] flex items-center gap-1.5">
                      <RefreshCw size={12} className="animate-spin text-emerald-600" /> System is actively monitoring verification status in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                  <button 
                    onClick={async () => {
                      const res = await fetch('/api/members');
                      const data = await res.json();
                      if (data.success && data.members) {
                        const fresh = data.members.find((m: any) => 
                          m.id === currentUser.id || 
                          m.account?.email?.toLowerCase() === (currentUser.account?.email || currentUser.email)?.toLowerCase() ||
                          (currentUser.diasporaId && m.diasporaId?.toUpperCase() === currentUser.diasporaId?.toUpperCase())
                        );
                        if (fresh) {
                          if (fresh.status === 'APPROVED') {
                            alert('🎉 Your Diaspora ID has been verified! Welcome to your Member Portal.');
                          } else {
                            alert('Status is still Pending Verification by Admin. Please wait.');
                          }
                          const regUser = { ...fresh, isRegistered: true };
                          setCurrentUser(regUser);
                          localStorage.setItem('ssa_user', JSON.stringify(regUser));
                        }
                      }
                      fetchData();
                    }}
                    className="clay-btn bg-emerald-600 clay-btn-green px-6 py-2.5 text-xs text-white flex items-center justify-center gap-2 font-bold"
                  >
                    <Clock size={14} /> Refresh Verification Status
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="clay-btn bg-slate-200 text-slate-700 px-6 py-2.5 text-xs font-semibold"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* IF SUSPENDED */}
            {currentUser && userType === 'MEMBER' && currentUser.isRegistered && currentUser.status === 'SUSPENDED' && (
              <div className="clay-card p-8 text-center space-y-5 max-w-lg mx-auto border border-rose-200 bg-rose-50/40 no-print">
                <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <AlertTriangle size={32} />
                </div>
                <div className="space-y-2">
                  <span className="inline-block bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Account Suspended
                  </span>
                  <h3 className="text-xl font-black text-slate-800">Your Account Has Been Suspended</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    Your Diaspora ID account has been temporarily suspended. Please contact the Diaspora Admin Office for assistance.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-1">
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/members');
                        const data = await res.json();
                        if (data.success && data.members) {
                          const fresh = data.members.find((m: any) => 
                            m.id === currentUser.id || 
                            m.account?.email?.toLowerCase() === (currentUser.account?.email || currentUser.email)?.toLowerCase()
                          );
                          if (fresh) {
                            if (fresh.status === 'APPROVED') {
                              alert('🎉 Your card has been unsuspended! Welcome back to your Member Portal.');
                            } else {
                              alert(`Your card status is currently: ${fresh.status}. Contact Admin if you believe this is an error.`);
                            }
                            const regUser = { ...fresh, isRegistered: true };
                            setCurrentUser(regUser);
                            localStorage.setItem('ssa_user', JSON.stringify(regUser));
                          }
                        }
                        fetchData();
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                    className="clay-btn bg-emerald-600 clay-btn-green px-5 py-2.5 text-xs text-white flex items-center justify-center gap-2 font-bold"
                  >
                    <Clock size={14} /> Refresh Card Status
                  </button>
                  <a href="mailto:support@ssa-diaspora.gov.ng" className="clay-btn bg-rose-600 px-5 py-2.5 text-xs text-white inline-flex items-center justify-center gap-2">
                    <Mail size={14} /> Contact Support
                  </a>
                  <button onClick={handleLogout} className="clay-btn bg-slate-200 text-slate-700 px-5 py-2.5 text-xs font-semibold">
                    Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* IF LOGGED IN AS FULLY APPROVED / VERIFIED DIASPORA MEMBER */}
            {currentUser && userType === 'MEMBER' && currentUser.isRegistered && currentUser.status === 'APPROVED' && (
              <div className="space-y-10">
                
                {/* Profile Overview and Virtual Card */}
                <div className="grid md:grid-cols-2 gap-8 items-start">
                  
                  {/* Virtual ID Card View */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center no-print">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Award size={20} className="text-emerald-600" /> Virtual ID Card
                      </h3>
                      {/* Front / Back Toggle */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button 
                          type="button" 
                          onClick={() => setCardSide('FRONT')} 
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            cardSide === 'FRONT' 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Award size={12} /> Front
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCardSide('BACK')} 
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                            cardSide === 'BACK' 
                              ? 'bg-emerald-600 text-white shadow-sm' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <RotateCw size={12} /> Back
                        </button>
                      </div>
                    </div>
                    
                    {/* Screen View (Toggleable Front / Back) */}
                    <div className="no-print">
                      {cardSide === 'FRONT' ? (
                        /* The Front Card Container */
                        <div className="id-card-clay p-6 max-w-md mx-auto relative overflow-hidden flex flex-col justify-between min-h-[300px] text-slate-800 transition-all">
                          {/* Top Header */}
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-3">
                            <div>
                              <h4 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 leading-tight uppercase">DIASPORA MEMBERSHIP</h4>
                              <p className="text-[9px] sm:text-[10px] text-emerald-700 font-extrabold uppercase tracking-tight">Diaspora Membership ID Card</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                currentUser.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                              }`}>
                                {currentUser.status}
                              </span>
                            </div>
                          </div>

                          {/* Card Body details */}
                          <div className="flex gap-4 items-center my-auto py-2">
                            {/* Photograph */}
                            <img 
                              src={currentUser.photoUrl || 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png'} 
                              className="w-20 h-24 rounded-xl object-cover border-2 border-white shadow bg-slate-100 shrink-0" 
                              alt="Photo" 
                            />
                            
                            {/* Information Details */}
                            <div className="space-y-1 text-xs">
                              <p className="font-extrabold text-sm tracking-tight text-slate-900 leading-snug">{currentUser.fullName}</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                ID: <strong className="text-slate-900 font-bold font-mono text-[11px]">{formatDiasporaId(currentUser.diasporaId) || 'NIG-DIA-000001'}</strong>
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Country: <strong className="text-slate-800 font-semibold">{currentUser.overseasAddress?.country || 'United Kingdom'}</strong>
                              </p>
                              <p className="text-[10px] text-slate-500">
                                State of Origin: <strong className="text-slate-800 font-semibold">{currentUser.stateOfOrigin || currentUser.nigerianAddress?.state || currentUser.overseasAddress?.state || 'Kano State'}</strong>
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Phone: <strong className="text-slate-800 font-semibold">{currentUser.overseasAddress?.phone || currentUser.nigerianAddress?.phone || 'N/A'}</strong>
                              </p>
                              {currentUser.issueDate && (
                                <p className="text-[9px] text-slate-400">
                                  Issued: {currentUser.issueDate}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Footer & QR Code */}
                          <div className="flex justify-between items-end border-t border-slate-200/60 pt-2.5">
                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                              Digital Membership Card • SSA Diaspora Platform
                            </span>
                            
                            {/* Dynamic QR Code link */}
                            <div className="w-11 h-11 bg-white p-1 rounded-lg shadow-inner border border-slate-200">
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
                      ) : (
                        /* The Back Card Container */
                        <div className="id-card-clay p-6 max-w-md mx-auto relative overflow-hidden flex flex-col justify-between min-h-[300px] text-slate-800 transition-all">
                          {/* Back Top Header */}
                          <div className="flex justify-between items-center border-b border-slate-200/60 pb-2.5">
                            <div>
                              <h4 className="text-xs font-black tracking-wider text-slate-900 leading-tight uppercase">FEDERAL REPUBLIC OF NIGERIA</h4>
                              <p className="text-[8.5px] text-emerald-700 font-extrabold uppercase tracking-tight">Diaspora Membership ID Card</p>
                            </div>
                          </div>

                          {/* Emergency Contacts Box (Compact Side-by-Side without relationship) */}
                          <div className="my-auto space-y-2 py-1">
                            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 text-slate-800 space-y-1.5">
                              <div className="flex items-center gap-1 text-emerald-800 font-bold text-[9.5px] uppercase tracking-wider border-b border-emerald-200/60 pb-1">
                                <PhoneCall size={11} className="text-emerald-700" /> Emergency Contact
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px]">
                                {/* Contact 1 */}
                                {currentUser.emergencyContacts?.nigeria?.name ? (
                                  <div>
                                    <p className="text-slate-500 text-[8.5px] uppercase tracking-tight">Contact 1</p>
                                    <p className="font-extrabold text-slate-900 leading-tight">{currentUser.emergencyContacts.nigeria.name}</p>
                                    <p className="text-slate-700 font-mono text-[9.5px] font-semibold">{currentUser.emergencyContacts.nigeria.phone}</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-slate-500 text-[8.5px] uppercase tracking-tight">Contact 1</p>
                                    <p className="font-extrabold text-slate-900 leading-tight">Next of Kin</p>
                                    <p className="text-slate-700 font-mono text-[9.5px] font-semibold">+234 800 000 0000</p>
                                  </div>
                                )}

                                {/* Contact 2 */}
                                {currentUser.emergencyContacts?.overseas?.name ? (
                                  <div>
                                    <p className="text-slate-500 text-[8.5px] uppercase tracking-tight">Contact 2</p>
                                    <p className="font-extrabold text-slate-900 leading-tight">{currentUser.emergencyContacts.overseas.name}</p>
                                    <p className="text-slate-700 font-mono text-[9.5px] font-semibold">{currentUser.emergencyContacts.overseas.phone}</p>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Office Helpline & Notice */}
                            <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-700 uppercase tracking-tight text-[9px]">Official Contact:</span>
                                <span className="font-extrabold text-emerald-700 font-mono tracking-wider text-[11px]">07047000070</span>
                              </div>
                              <p className="text-[8px] text-slate-500 leading-tight pt-1 border-t border-slate-200">
                                This card remains the property of the Federal Republic of Nigeria Diaspora Service. If found, please return to the nearest Nigerian Embassy, High Commission, or call <strong>07047000070</strong>.
                              </p>
                            </div>
                          </div>

                          {/* Back Footer */}
                          <div className="flex justify-between items-center border-t border-slate-200/60 pt-2 text-[8px] text-slate-400 font-mono">
                            <span>AUTH CODE: {formatDiasporaId(currentUser.diasporaId) || 'NIG-DIA-000001'}</span>
                            <span className="font-sans font-bold text-emerald-700">SECURE VERIFIED</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Print Only: Render BOTH Front and Back Side together */}
                    <div className="hidden print-only space-y-6">
                      {/* Front for Print */}
                      <div className="id-card-clay id-card-print-wrap p-6 max-w-md mx-auto relative overflow-hidden flex flex-col justify-between h-72 text-slate-800">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <div>
                            <h4 className="text-xs font-black tracking-wider text-slate-900 leading-tight uppercase">DIASPORA MEMBERSHIP</h4>
                            <p className="text-[9px] text-emerald-700 font-extrabold uppercase tracking-tight">Diaspora Membership ID Card</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {currentUser.status}
                          </span>
                        </div>
                        <div className="flex gap-4 items-center my-auto">
                          <img 
                            src={currentUser.photoUrl || 'https://res.cloudinary.com/dpghoiocq/image/upload/v1700000000/placeholder_user.png'} 
                            className="w-20 h-20 rounded-xl object-cover border" 
                            alt="Photo" 
                          />
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-sm text-slate-900">{currentUser.fullName}</p>
                            <p className="text-[10px] text-slate-600">ID: <strong className="font-mono font-bold">{formatDiasporaId(currentUser.diasporaId) || 'NIG-DIA-000001'}</strong></p>
                            <p className="text-[10px] text-slate-600">Country: <strong>{currentUser.overseasAddress?.country || 'United Kingdom'}</strong></p>
                            <p className="text-[10px] text-slate-600">State of Origin: <strong>{currentUser.stateOfOrigin || currentUser.nigerianAddress?.state || currentUser.overseasAddress?.state || 'Kano State'}</strong></p>
                            <p className="text-[10px] text-slate-600">Phone: <strong>{currentUser.overseasAddress?.phone || currentUser.nigerianAddress?.phone || 'N/A'}</strong></p>
                            {currentUser.issueDate && <p className="text-[9px] text-slate-400">Issued: {currentUser.issueDate}</p>}
                          </div>
                        </div>
                        <div className="flex justify-between items-end border-t border-slate-200 pt-2">
                          <span className="text-[8px] text-slate-500 font-bold uppercase">Digital Membership Card</span>
                          <div className="w-10 h-10 bg-white p-0.5 border">
                            {currentUser.diasporaId && (
                              <img src={`https://chart.googleapis.com/chart?chs=100x100&cht=qr&chl=${encodeURIComponent('https://ssa-diaspora.vercel.app/verify?id=' + formatDiasporaId(currentUser.diasporaId))}`} className="w-full h-full" alt="QR" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Back for Print */}
                      <div className="id-card-clay id-card-print-wrap p-6 max-w-md mx-auto relative overflow-hidden flex flex-col justify-between h-72 text-slate-800">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <div>
                            <h4 className="text-xs font-black tracking-wider text-slate-900 leading-tight uppercase">FEDERAL REPUBLIC OF NIGERIA</h4>
                            <p className="text-[8px] text-emerald-700 font-extrabold uppercase">Diaspora Membership ID Card</p>
                          </div>
                        </div>
                        <div className="space-y-2 my-auto">
                          <div className="border border-emerald-200 bg-emerald-50/50 p-2.5 rounded-lg text-[10px] space-y-1">
                            <p className="font-bold text-emerald-800 text-[9px] uppercase tracking-wider border-b border-emerald-200/60 pb-0.5">Emergency Contact</p>
                            <div className="grid grid-cols-2 gap-2 pt-0.5">
                              <div>
                                <p className="font-bold text-slate-900 text-[11px]">{currentUser.emergencyContacts?.nigeria?.name || currentUser.emergencyContacts?.overseas?.name || 'Emergency Contact'}</p>
                                <p className="text-slate-600 text-[9.5px]">Phone: <strong className="text-slate-900 font-mono font-bold">{currentUser.emergencyContacts?.nigeria?.phone || currentUser.emergencyContacts?.overseas?.phone || 'N/A'}</strong></p>
                              </div>
                              {(currentUser.emergencyContacts?.overseas?.name && currentUser.emergencyContacts?.nigeria?.name && currentUser.emergencyContacts?.overseas?.name !== currentUser.emergencyContacts?.nigeria?.name) ? (
                                <div className="border-l border-emerald-200/60 pl-2">
                                  <p className="font-bold text-slate-900 text-[11px]">{currentUser.emergencyContacts.overseas.name}</p>
                                  <p className="text-slate-600 text-[9.5px]">Phone: <strong className="text-slate-900 font-mono font-bold">{currentUser.emergencyContacts.overseas.phone}</strong></p>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="border border-slate-200 bg-slate-50 p-2 rounded text-[10px]">
                            <p><strong>Office Contact:</strong> <span className="font-bold text-emerald-700 font-mono">07047000070</span></p>
                            <p className="text-[8px] text-slate-500 pt-1">If found, please return to the nearest Nigerian Embassy, High Commission, or call 07047000070.</p>
                          </div>
                        </div>
                        <div className="border-t border-slate-200 pt-1 flex justify-between text-[8px] text-slate-400 font-mono">
                          <span>AUTH CODE: {formatDiasporaId(currentUser.diasporaId) || 'NIG-DIA-000001'}</span>
                          <span>SECURE VERIFIED</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex flex-col items-center gap-3 no-print pt-2">
                      <div className="flex flex-wrap justify-center gap-3 w-full sm:w-auto">
                        <button onClick={handlePrintCard} className="clay-btn bg-emerald-600 clay-btn-green px-5 py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold shadow-md">
                          <Printer size={15} /> Print Virtual ID
                        </button>
                        <button onClick={handleDownloadCard} className="clay-btn bg-blue-600 clay-btn-blue px-5 py-2.5 text-xs flex items-center justify-center gap-1.5 font-bold shadow-md">
                          <Download size={15} /> Download Card
                        </button>
                        <div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            id="profilePicUpload" 
                            className="hidden" 
                            onChange={handleProfilePicUpload} 
                          />
                          <label htmlFor="profilePicUpload" className="clay-btn clay-btn-grey px-4 py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer font-bold shadow-sm">
                            <Upload size={14} className="text-slate-600" /> Update Photo
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account overview profile details (Executive Luxury Design) */}
                  <div className="clay-card clay-card-emerald p-6 space-y-5 no-print relative overflow-hidden shadow-lg">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

                    <div className="flex justify-between items-center border-b border-emerald-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md">
                          <User size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-900 leading-tight">Member Profile Overview</h3>
                          <p className="text-[11px] text-emerald-700 font-bold">Verified Diaspora Records</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                        <CheckCircle size={12} className="text-emerald-600" /> Verified
                      </span>
                    </div>

                    {/* Detailed info grid with colored icon tiles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <Mail size={12} className="text-emerald-600" /> Official Email
                        </div>
                        <p className="font-extrabold text-slate-800 truncate">{currentUser.account?.email || currentUser.email}</p>
                      </div>

                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <User size={12} className="text-blue-600" /> DOB & Gender
                        </div>
                        <p className="font-extrabold text-slate-800">{currentUser.dob || '1995-01-01'} ({currentUser.gender || 'Not Specified'})</p>
                      </div>

                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <Phone size={12} className="text-amber-600" /> Overseas Phone
                        </div>
                        <p className="font-extrabold text-slate-900 font-mono text-[11.5px]">
                          {currentUser.overseasAddress?.phone || currentUser.nigerianAddress?.phone || 'N/A'}
                        </p>
                      </div>

                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <MapPin size={12} className="text-teal-600" /> State of Origin
                        </div>
                        <p className="font-extrabold text-slate-800">
                          {currentUser.stateOfOrigin || currentUser.nigerianAddress?.state || currentUser.overseasAddress?.state || 'Kano State'}
                        </p>
                      </div>

                      <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 shadow-sm space-y-0.5 sm:col-span-2">
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <Globe size={12} className="text-indigo-600" /> Overseas Registered Address
                        </div>
                        <p className="font-extrabold text-slate-800">
                          {currentUser.overseasAddress?.street ? `${currentUser.overseasAddress.street}, ${currentUser.overseasAddress.city}, ${currentUser.overseasAddress.state}, ${currentUser.overseasAddress.country}` : 'London, United Kingdom'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Issue / My Cases Section (Modern Colorful Design) */}
                <div className="grid md:grid-cols-2 gap-8 items-start no-print">
                  
                  {/* Issue Form (Rich Amber/Orange Case Assistance Theme) */}
                  <div className="clay-card clay-card-amber p-6 space-y-5 relative overflow-hidden shadow-lg">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600"></div>

                    <div className="flex items-center gap-3 border-b border-amber-200/80 pb-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                        <FileText size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">Report an Issue</h3>
                        <p className="text-xs text-amber-800 font-semibold">Direct Consular, Legal & Welfare Assistance</p>
                      </div>
                    </div>
                    
                    {successCaseNumber && (
                      <div className="bg-emerald-50 text-emerald-900 text-xs p-4 rounded-xl border border-emerald-200 space-y-1 shadow-sm">
                        <p className="font-black flex items-center gap-1.5 text-emerald-800">
                          <CheckCircle size={15} /> Case Submitted Successfully!
                        </p>
                        <p className="font-medium">Your Case Tracking ID: <strong className="font-mono text-emerald-950 font-black">{successCaseNumber}</strong></p>
                      </div>
                    )}

                    <form onSubmit={handleReportIssue} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-black text-slate-700">Issue Category *</label>
                          <select 
                            className="clay-input font-bold text-slate-800 bg-white" value={caseCategory}
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
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-black text-slate-700">Country of Occurrence *</label>
                          <select 
                            className="clay-input font-bold text-slate-800 bg-white" 
                            value={caseCountry} 
                            onChange={e => setCaseCountry(e.target.value)}
                          >
                            {SUPPORTED_COUNTRIES.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-black text-slate-700">Direct Phone Contact *</label>
                          <input 
                            type="tel" required className="clay-input font-mono font-bold" placeholder="+44 79..."
                            value={casePhone} onChange={e => setCasePhone(e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-black text-slate-700">Specific Location / City</label>
                          <input 
                            type="text" className="clay-input" placeholder="e.g. London Heathrow / Dubai"
                            value={caseLocation} onChange={e => setCaseLocation(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black text-slate-700">Description of Issue *</label>
                        <textarea 
                          required rows={3} className="clay-input font-medium text-xs leading-relaxed" placeholder="Please provide clear, full details of the incident or assistance requested..."
                          value={caseDescription} onChange={e => setCaseDescription(e.target.value)}
                        />
                      </div>

                      {/* Attachments */}
                      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/70 space-y-2">
                        <label className="text-xs font-black text-slate-700 block">Attach Evidence (Photos, Voice, Video, PDF)</label>
                        <div className="flex flex-wrap gap-2.5 items-center">
                          <label className="clay-btn clay-btn-grey text-slate-800 py-2 px-3.5 text-xs cursor-pointer font-bold">
                            <Upload size={13} className="mr-1 text-slate-600" /> Attach Files
                            <input type="file" accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={e => handleFileChange(e, 'case')} />
                          </label>
                          <span className="text-[11px] text-slate-500 font-semibold">({caseMediaPreviews.length} files attached)</span>
                        </div>

                        {caseMediaPreviews.length > 0 && (
                          <div className="flex gap-2 flex-wrap pt-2">
                            {caseMediaPreviews.map((preview, i) => (
                              <div key={i} className="relative w-12 h-12 rounded-lg border border-amber-200 overflow-hidden shadow-sm bg-white flex items-center justify-center">
                                {preview.startsWith('data:image/') ? (
                                  <img src={preview} className="w-full h-full object-cover" />
                                ) : preview.startsWith('data:audio/') ? (
                                  <Volume2 size={18} className="text-emerald-500" />
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

                      {/* Urgent Flag Banner */}
                      <div className="bg-rose-50/90 border border-rose-200 p-3 rounded-xl flex items-center gap-3">
                        <input 
                          type="checkbox" id="urgent" checked={caseIsUrgent}
                          onChange={e => setCaseIsUrgent(e.target.checked)}
                          className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                        />
                        <label htmlFor="urgent" className="text-xs font-black text-rose-800 cursor-pointer flex items-center gap-1.5 select-none">
                          <AlertTriangle size={15} className="text-rose-600" /> Flag as Urgent Emergency Case
                        </label>
                      </div>

                      <button type="submit" disabled={submittingCase} className="clay-btn bg-amber-600 clay-btn-gold w-full py-3 text-sm font-black text-white shadow-lg flex items-center justify-center gap-2">
                        {submittingCase ? 'Submitting Report...' : 'Submit Case Report'} <Send size={15} />
                      </button>
                    </form>
                  </div>

                  {/* My Cases List (Rich Blue/Indigo Tracker Theme) */}
                  <div className="clay-card clay-card-blue p-6 space-y-5 relative overflow-hidden shadow-lg">
                    {/* Top Accent Line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-600"></div>

                    <div className="flex justify-between items-center border-b border-blue-100 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                          <Briefcase size={22} />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight">My Case Reports</h3>
                          <p className="text-xs text-blue-800 font-semibold">Live Consular Tracking</p>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                        {cases.filter(c => c.memberId === (currentUser.account?.email || currentUser.email)).length} Active
                      </span>
                    </div>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                      {cases.filter(c => c.memberId === (currentUser.account?.email || currentUser.email)).length === 0 ? (
                        <div className="text-center py-12 space-y-2 bg-white/60 rounded-2xl border border-blue-100">
                          <Shield size={32} className="text-blue-400 mx-auto" />
                          <p className="text-xs text-slate-500 font-semibold">You haven't submitted any cases yet.</p>
                          <p className="text-[11px] text-slate-400">Use the form to report immigration, legal, or emergency issues.</p>
                        </div>
                      ) : (
                        cases
                          .filter(c => c.memberId === (currentUser.account?.email || currentUser.email))
                          .map((item) => (
                            <div key={item.id} className="clay-card-inner p-4 space-y-3 bg-white/95 border border-blue-100 shadow-sm">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] font-black font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                                    {item.caseNumber}
                                  </span>
                                  <h4 className="font-extrabold text-slate-900 text-sm mt-1">{item.category}</h4>
                                </div>
                                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                                  item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                                  item.status === 'REFERRED' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                  'bg-blue-100 text-blue-800 border-blue-200'
                                }`}>
                                  {item.status}
                                </span>
                              </div>

                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{item.description}</p>
                              
                              {item.referredAgency && (
                                <div className="text-[10px] font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                  <Globe size={11} className="text-blue-700" /> Referred Desk: {item.referredAgency}
                                </div>
                              )}

                              {/* Progress pipeline */}
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[8px] text-slate-500 font-black uppercase">
                                  <span>Submitted</span>
                                  <span>Referred</span>
                                  <span>Resolved</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                                  <div className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all ${
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
                
                {/* Stats row with Real-Time Data */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="clay-card clay-card-emerald p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Members</span>
                      <div className="w-7 h-7 rounded-lg bg-emerald-200/60 text-emerald-800 flex items-center justify-center font-bold">
                        <User size={14} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-slate-900">{stats.totalMembers}</p>
                    <span className="text-[10px] text-amber-700 font-bold block">{stats.pendingMembers} pending verification</span>
                  </div>

                  <div className="clay-card clay-card-blue p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider">Verified Members</span>
                      <div className="w-7 h-7 rounded-lg bg-blue-200/60 text-blue-800 flex items-center justify-center font-bold">
                        <Shield size={14} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-blue-900">{stats.verifiedMembers}</p>
                    <span className="text-[10px] text-blue-700 font-bold block">Active virtual cards</span>
                  </div>

                  <div className="clay-card clay-card-amber p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Active Cases</span>
                      <div className="w-7 h-7 rounded-lg bg-amber-200/60 text-amber-800 flex items-center justify-center font-bold">
                        <AlertTriangle size={14} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-amber-900">
                      {stats.activeCases}
                    </p>
                    <span className="text-[10px] text-rose-600 font-bold block">{stats.urgentCases} flagged urgent</span>
                  </div>

                  <div className="clay-card clay-card-purple p-5 space-y-1 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider">Resolved Cases</span>
                      <div className="w-7 h-7 rounded-lg bg-purple-200/60 text-purple-800 flex items-center justify-center font-bold">
                        <CheckCircle size={14} />
                      </div>
                    </div>
                    <p className="text-3xl font-black text-purple-900">{stats.resolved}</p>
                    <span className="text-[10px] text-purple-700 font-bold block">Coordination closed</span>
                  </div>
                </div>

                {/* Manual Adjustment Card matching screenshot */}
                <div className="clay-card p-6 max-w-xl mx-auto space-y-4 border border-rose-200/80 bg-gradient-to-b from-white to-rose-50/20 shadow-lg">
                  <div className="flex items-center gap-2 text-rose-600 font-bold border-b pb-2">
                    <Radio size={20} className="animate-pulse text-rose-500" />
                    <h3 className="text-base font-black text-slate-800 tracking-tight">Manual Case & Member Adjustment</h3>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Quickly add or remove counts from tracking categories for manual reconciliation.
                  </p>

                  <div className="space-y-3 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-slate-700">Case / Member Category</label>
                      <select 
                        className="clay-input font-bold text-slate-800 bg-white"
                        value={manualAdjustment.category}
                        onChange={e => setManualAdjustment({...manualAdjustment, category: e.target.value})}
                      >
                        <option value="Total Members">Total Members / Total Submissions</option>
                        <option value="Verified Members">Verified Members / Completed</option>
                        <option value="Active Cases">Active Cases / Processing Cases</option>
                        <option value="New (Received)">New (Received)</option>
                        <option value="Resolved Cases">Resolved Cases</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-slate-700">Amount</label>
                      <input 
                        type="number" 
                        min="1" 
                        className="clay-input font-bold text-slate-800 bg-white"
                        placeholder="1"
                        value={manualAdjustment.amount}
                        onChange={e => setManualAdjustment({...manualAdjustment, amount: e.target.value})}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-slate-700">Reason (optional)</label>
                      <input 
                        type="text" 
                        className="clay-input text-slate-700 bg-white"
                        placeholder="e.g. Batch import, manual reconciliation"
                        value={manualAdjustment.reason}
                        onChange={e => setManualAdjustment({...manualAdjustment, reason: e.target.value})}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2.5 pt-2">
                      <button 
                        type="button"
                        onClick={() => handleApplyAdjustment('ADD')}
                        className="clay-btn bg-emerald-600 text-white font-black text-xs px-4 py-2.5 flex-1 flex items-center justify-center gap-1.5 hover:bg-emerald-700 transition-colors shadow-md"
                      >
                        <Plus size={15} /> Add ({manualAdjustment.amount || '0'})
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleApplyAdjustment('REMOVE')}
                        className="clay-btn bg-amber-600 text-white font-black text-xs px-4 py-2.5 flex-1 flex items-center justify-center gap-1.5 hover:bg-amber-700 transition-colors shadow-md"
                      >
                        <UserMinus size={15} /> Remove ({manualAdjustment.amount || '0'})
                      </button>
                      <button 
                        type="button"
                        onClick={handleSetExactCount}
                        className="clay-btn bg-blue-600 text-white font-black text-xs px-4 py-2.5 flex-1 flex items-center justify-center gap-1.5 hover:bg-blue-700 transition-colors shadow-md"
                      >
                        <Award size={15} /> Set Exact to {manualAdjustment.amount || '0'}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <button 
                        type="button"
                        onClick={handleResetOffsets}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={13} /> Reset All Counts to Real DB Values (0)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Country Desks stats and filters */}
                <div className="clay-card p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Globe size={18} className="text-emerald-600" />
                    <span className="text-sm font-bold text-slate-700">Country Desk Filter:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                    {['All', ...SUPPORTED_COUNTRIES].map((desk) => (
                      <button 
                        key={desk} 
                        onClick={() => setSelectedCountryDesk(desk)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                          selectedCountryDesk === desk 
                            ? 'bg-emerald-600 text-white shadow-inner' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="text-amber-500" size={18} /> Pending Member Approvals ({members.filter(m => m.status === 'PENDING').length})
                      </h3>
                      <button 
                        onClick={() => fetchData()}
                        className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                        title="Refresh Registrations"
                      >
                        <RefreshCw size={13} /> Refresh List
                      </button>
                    </div>

                    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                      {members.filter(m => m.status === 'PENDING').length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-12">No registrations pending verification.</p>
                      ) : (
                        members
                          .filter(m => m.status === 'PENDING')
                          .map((m) => (
                            <div key={m.id} className="clay-card-inner p-4 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-3 items-center">
                                  <img src={m.photoUrl} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                  <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{m.fullName}</h4>
                                    <p className="text-[10px] text-slate-500">{m.account.email} | Country: {m.overseasAddress.country}</p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleDeleteMember(m.id, m.fullName)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                                  title="Delete/Remove Member from system"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="bg-slate-50 p-2.5 rounded text-[10px] space-y-1 text-slate-600">
                                <p><strong>Passport:</strong> {m.identification.passportNumber} | <strong>NIN:</strong> {m.identification.ninNumber}</p>
                                <p><strong>Origin:</strong> {m.stateOfOrigin} State | <strong>LGA:</strong> {m.lga}</p>
                              </div>

                              {m.identification.documentUrl && (
                                <a 
                                  href={m.identification.documentUrl} target="_blank" rel="noreferrer"
                                  className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                  <FileText size={12} /> View Uploaded Verification Document <ExternalLink size={10} />
                                </a>
                              )}

                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t border-slate-100">
                                <div>
                                  <span className="text-[10px] text-slate-500 font-semibold">Assigned ID: </span>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                                    {m.diasporaId || 'Auto-generated on approval'}
                                  </span>
                                </div>
                                <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
                                  <button 
                                    onClick={() => handleRejectMember(m.id)}
                                    className="clay-btn clay-btn-red text-[10px] px-3 py-1.5"
                                  >
                                    Reject
                                  </button>
                                  <button 
                                    onClick={() => handleApproveMember(m.id, m.diasporaId || undefined)}
                                    className="clay-btn bg-emerald-600 clay-btn-green text-[10px] px-4 py-1.5 text-white font-bold"
                                  >
                                    Approve Member
                                  </button>
                                </div>
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
                            <div key={m.id} className="clay-card-inner p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                              <div className="flex gap-3 items-center">
                                <img src={m.photoUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                                <div>
                                  <h4 className="font-bold text-slate-800 text-xs">{m.fullName}</h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                                      {m.diasporaId || 'NO ID ASSIGNED'}
                                    </span>
                                  </div>
                                  <p className="text-[9px] text-slate-400 mt-0.5">{m.account.email} | {m.overseasAddress.country}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0 self-end sm:self-center items-center">
                                <button 
                                  onClick={() => handleSuspendMember(m.id)}
                                  className="clay-btn clay-btn-red text-[9px] px-2.5 py-1"
                                >
                                  Suspend Card
                                </button>
                                <button 
                                  onClick={() => handleDeleteMember(m.id, m.fullName)}
                                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                                  title="Delete/Remove Member"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Suspended Members list */}
                {members.some(m => m.status === 'SUSPENDED') && (
                  <div className="clay-card p-6 space-y-4 border border-rose-200/70 bg-rose-50/20">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="text-rose-500" size={18} /> Suspended Cards ({members.filter(m => m.status === 'SUSPENDED').length})
                    </h3>

                    <div className="grid md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                      {members
                        .filter(m => m.status === 'SUSPENDED')
                        .map((m) => (
                          <div key={m.id} className="clay-card-inner p-3 flex justify-between items-center gap-3 border-rose-200">
                            <div className="flex gap-3 items-center">
                              <img src={m.photoUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs">{m.fullName}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded font-mono">
                                    {m.diasporaId || 'NO ID'}
                                  </span>
                                  <span className="text-[9px] font-bold uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                    SUSPENDED
                                  </span>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-0.5">{m.account.email} | {m.overseasAddress.country}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                onClick={() => handleUnsuspendMember(m.id)}
                                className="clay-btn bg-emerald-600 clay-btn-green text-[10px] px-3 py-1.5 text-white font-bold"
                              >
                                Unsuspend Card
                              </button>
                              <button 
                                onClick={() => handleDeleteMember(m.id, m.fullName)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                                title="Delete/Remove Member"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}



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
                            className={`clay-card-inner p-4 space-y-3 cursor-pointer hover:border-emerald-300 transition-all ${
                              selectedCase?.id === c.id ? 'border-2 border-emerald-400 bg-emerald-50/20' : ''
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
                                c.status === 'REFERRED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
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
                                  className="p-1 rounded bg-slate-100 border text-[10px] text-emerald-600 flex items-center gap-1 hover:underline"
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

                          <button type="submit" className="clay-btn bg-emerald-600 clay-btn-green w-full py-2 text-xs">
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
                    type="text" required className="clay-input flex-1" placeholder="e.g. NIG-DIA-000001"
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
