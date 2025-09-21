import React from 'react';
import Layout from '../components/Layout';

const ProfileTest: React.FC = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Profile Page Test
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          If you can see this, the profile page routing is working correctly.
        </p>
      </div>
    </Layout>
  );
};

export default ProfileTest;