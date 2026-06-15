import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';
import Layout from '../components/Layout';
import { habitsApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['habit-stats'],
    queryFn: () => habitsApi.getStats(),
  });

  const weeklyData = stats?.weeklyData || [];
  const categoryData = stats?.categoryData || [];
  const monthlyProgress = stats?.monthlyProgress || [];

  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => habitsApi.client.get('/users/me/stats').then(res => res.data),
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="large" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-full rounded-2xl p-6" style={{ backgroundColor: '#FEFAE0' }}>
        <div className="space-y-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight text-[#344E41] dark:text-gray-100">Summary</h1>
            <p className="text-[#344E41] dark:text-gray-100 opacity-80 mt-1 text-lg">Detailed insights into your habit-building journey</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col justify-between transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Target className="h-8 w-8 text-[#E9C46A]" />
                <p className="text-3xl font-bold text-[#344E41] dark:text-gray-100">{stats?.totalHabits || 0}</p>
              </div>
              <p className="text-[#344E41] dark:text-gray-100 font-medium opacity-90">Total Habits</p>
            </div>

            <div className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col justify-between transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="h-8 w-8 text-[#344E41] dark:text-gray-100" />
                <p className="text-3xl font-bold text-[#344E41] dark:text-gray-100">{stats?.completedToday || 0}</p>
              </div>
              <p className="text-[#344E41] dark:text-gray-100 font-medium opacity-90">Completed Today</p>
            </div>

            <div className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col justify-between transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-[#E9C46A]" />
                <p className="text-3xl font-bold text-[#344E41] dark:text-gray-100">{userStats?.currentStreak || 0}</p>
              </div>
              <p className="text-[#344E41] dark:text-gray-100 font-medium opacity-90">Current Streak</p>
            </div>

            <div className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6 flex flex-col justify-between transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-[#E9C46A]" />
                <p className="text-3xl font-bold text-[#344E41] dark:text-gray-100">{userStats?.longestStreak || 0}</p>
              </div>
              <p className="text-[#344E41] dark:text-gray-100 font-medium opacity-90">Best Streak</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Progress */}
            <div className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-transparent">
              <h3 className="text-xl font-bold text-[#344E41] dark:text-gray-100 mb-6">Weekly Progress</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#344E41" opacity={0.1} vertical={false} />
                  <XAxis dataKey="day" stroke="#344E41" axisLine={false} tickLine={false} />
                  <YAxis stroke="#344E41" axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FEFAE0',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#344E41',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#344E41', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="completed" fill="#344E41" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="total" fill="#E9C46A" radius={[4, 4, 0, 0]} barSize={30} opacity={0.6} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            <div className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-transparent">
              <h3 className="text-xl font-bold text-[#344E41] dark:text-gray-100 mb-6">Habits by Category</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    stroke="#A3B18A"
                    strokeWidth={4}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FEFAE0',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#344E41'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-2">
                {categoryData.map((cat, idx) => (
                  <div key={idx} className="flex items-center text-sm font-medium text-[#344E41] dark:text-gray-100">
                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-[#A3B18A] dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-transparent">
            <h3 className="text-xl font-bold text-[#344E41] dark:text-gray-100 mb-6">6-Month Completion Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="#344E41" opacity={0.1} vertical={false} />
                <XAxis dataKey="month" stroke="#344E41" axisLine={false} tickLine={false} />
                <YAxis stroke="#344E41" axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FEFAE0',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#344E41',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Completion Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="completion" 
                  stroke="#344E41" 
                  strokeWidth={4}
                  dot={{ fill: '#FEFAE0', stroke: '#344E41', strokeWidth: 3, r: 6 }}
                  activeDot={{ r: 8, fill: '#E9C46A', stroke: '#344E41' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
