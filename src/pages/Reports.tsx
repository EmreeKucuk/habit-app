import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Calendar, Target, Award, Activity, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import Layout from '../components/Layout';
import { habitsApi, usersApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports: React.FC = () => {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['habit-stats'],
    queryFn: () => habitsApi.getStats(),
  });

  const { data: userStats, isLoading: isUserStatsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => usersApi.getStats(),
  });

  if (isStatsLoading || isUserStatsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  const weeklyData = stats?.weeklyData || [];
  const categoryData = stats?.categoryData || [];
  const monthlyProgress = stats?.monthlyProgress || [];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#FEFAE0] dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-[#344E41]/10 dark:border-gray-700">
          <p className="font-bold text-[#344E41] dark:text-gray-100 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <p className="text-sm font-medium text-[#344E41] dark:text-gray-200">
                {entry.name}: <span className="font-bold">{entry.value}{entry.unit || ''}</span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-[#344E41] dark:text-gray-100 tracking-tight">Analytics</h1>
            <p className="text-[#344E41] dark:text-gray-100 opacity-60 font-medium mt-2">
              Your habit-building journey visualized
            </p>
          </div>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Habits", value: stats?.totalHabits || 0, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Completed Today", value: stats?.completedToday || 0, icon: Calendar, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Current Streak", value: userStats?.currentStreak || 0, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "Best Streak", value: userStats?.longestStreak || 0, icon: Award, color: "text-yellow-500", bg: "bg-yellow-500/10" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={itemVariants}
                className="bg-[#FFFFFF] dark:bg-gray-800 rounded-[24px] p-6 shadow-sm border border-[#344E41] dark:border-gray-700 border-opacity-5 hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <stat.icon className={`w-24 h-24 ${stat.color}`} />
                </div>
                <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 relative z-10`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-[#344E41] dark:text-gray-100 opacity-60 uppercase tracking-wider mb-1 relative z-10">
                  {stat.label}
                </p>
                <p className="text-4xl font-black text-[#344E41] dark:text-gray-100 relative z-10">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Weekly Activity Bar Chart */}
            <motion.div variants={itemVariants} className="xl:col-span-2 bg-[#FFFFFF] dark:bg-gray-800 rounded-[24px] p-8 shadow-sm border border-[#344E41] dark:border-gray-700 border-opacity-5">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-[#A3B18A]/20 dark:bg-green-900/40 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-[#A3B18A] dark:text-green-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#344E41] dark:text-gray-100">Weekly Activity</h2>
                  <p className="text-sm font-medium text-[#344E41] dark:text-gray-400 opacity-60">Completed vs Total Habits</p>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                    <Bar dataKey="completed" name="Completed" fill="#A3B18A" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="total" name="Total Targets" fill="#E9C46A" opacity={0.6} radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category Breakdown Pie Chart */}
            <motion.div variants={itemVariants} className="bg-[#FFFFFF] dark:bg-gray-800 rounded-[24px] p-8 shadow-sm border border-[#344E41] dark:border-gray-700 border-opacity-5">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-purple-500/10 rounded-xl">
                  <PieChartIcon className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#344E41] dark:text-gray-100">Categories</h2>
                  <p className="text-sm font-medium text-[#344E41] dark:text-gray-400 opacity-60">Distribution of habits</p>
                </div>
              </div>
              <div className="h-[250px] w-full relative flex items-center justify-center">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center opacity-50">
                    <PieChartIcon className="w-12 h-12 mx-auto mb-2 text-[#344E41] dark:text-gray-100" />
                    <p className="text-[#344E41] dark:text-gray-100 font-medium">No category data</p>
                  </div>
                )}
                {categoryData.length > 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-[#344E41] dark:text-gray-100">{stats?.totalHabits || 0}</span>
                    <span className="text-xs font-bold text-[#344E41] dark:text-gray-400 opacity-60 uppercase">Habits</span>
                  </div>
                )}
              </div>
              <div className="mt-6 space-y-3">
                {categoryData.map((cat: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-bold text-[#344E41] dark:text-gray-200">{cat.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#344E41] dark:text-gray-100 opacity-60">{cat.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Monthly Trend Area Chart */}
          <motion.div variants={itemVariants} className="bg-[#FFFFFF] dark:bg-gray-800 rounded-[24px] p-8 shadow-sm border border-[#344E41] dark:border-gray-700 border-opacity-5">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#344E41] dark:text-gray-100">6-Month Trend</h2>
                <p className="text-sm font-medium text-[#344E41] dark:text-gray-400 opacity-60">Monthly completion rate</p>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888888" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888888', fontSize: 12 }} domain={[0, 100]} />
                  <RechartsTooltip 
                    content={<CustomTooltip />} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completion" 
                    name="Completion Rate"
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorCompletion)" 
                    unit="%"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Reports;
