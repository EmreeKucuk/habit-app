import React from 'react';
import Layout from '../components/Layout';

const ProfileSimple: React.FC = () => {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Profile page is loading...</p>
        <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <p className="text-green-800 dark:text-green-200">✅ Profile page component is rendering!</p>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSimple;