import React, { useMemo, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Activity, ArrowDownUp, ArrowLeft, ArrowRight, Bell, Bookmark, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Compass, Hash, Heart, Home, LogOut, Menu, MessageCircle, MessageSquare, MoreHorizontal, Plus, Search, Send, Settings, Sparkles, ThumbsUp, Users, X, Zap } from 'lucide-react';
import { useApp } from '../state.jsx';
import { Avatar, Button, Empty, FilterBar, PageHead, QuestionCard, DiscussionCard, SessionCard, SectionHead, Stat, Tag, cats } from '../components/common/index.jsx';
export default function NotFound(){return <Empty title="This page wandered off" body="Head back to your learning space and keep going." action={<Link className="btn btn-primary" to="/">Go to dashboard</Link>}/>;}
