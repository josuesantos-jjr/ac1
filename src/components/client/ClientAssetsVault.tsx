'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Image,
  Video,
  Download,
  Share,
  Search,
  Folder,
  Grid,
  List,
  Filter,
  Upload,
  Eye,
  Star
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'presentation';
  size: string;
  uploadDate: string;
  category: string;
  downloads: number;
  favorite: boolean;
  url: string;
}

const ClientAssetsVault: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando dados de assets
    const mockAssets: Asset[] = [
      {
        id: '1',
        name: 'Product Brochure 2024',
        type: 'document',
        size: '2.4 MB',
        uploadDate: '2024-01-15',
        category: 'marketing',
        downloads: 145,
        favorite: true,
        url: '#'
      },
      {
        id: '2',
        name: 'Service Presentation',
        type: 'presentation',
        size: '8.7 MB',
        uploadDate: '2024-01-10',
        category: 'sales',
        downloads: 89,
        favorite: false,
        url: '#'
      },
      {
        id: '3',
        name: 'Brand Guidelines',
        type: 'document',
        size: '5.2 MB',
        uploadDate: '2024-01-08',
        category: 'brand',
        downloads: 67,
        favorite: true,
        url: '#'
      },
      {
        id: '4',
        name: 'Product Demo Video',
        type: 'video',
        size: '45.8 MB',
        uploadDate: '2024-01-12',
        category: 'marketing',
        downloads: 203,
        favorite: false,
        url: '#'
      },
      {
        id: '5',
        name: 'Logo Pack',
        type: 'image',
        size: '12.3 MB',
        uploadDate: '2024-01-05',
        category: 'brand',
        downloads: 98,
        favorite: false,
        url: '#'
      }
    ];

    setAssets(mockAssets);
    setLoading(false);
  }, []);

  const categories = [
    { id: 'all', name: 'All Assets', count: assets.length },
    { id: 'marketing', name: 'Marketing', count: assets.filter(a => a.category === 'marketing').length },
    { id: 'sales', name: 'Sales', count: assets.filter(a => a.category === 'sales').length },
    { id: 'brand', name: 'Brand', count: assets.filter(a => a.category === 'brand').length }
  ];

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'document': return FileText;
      case 'image': return Image;
      case 'video': return Video;
      case 'presentation': return FileText;
      default: return FileText;
    }
  };

  const getAssetColor = (type: string) => {
    switch (type) {
      case 'document': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'image': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'video': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'presentation': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assets Vault
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Access marketing materials, documents, and resources
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Asset
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.name} ({category.count})
          </button>
        ))}
      </div>

      {/* Assets Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map((asset, index) => {
            const IconComponent = getAssetIcon(asset.type);
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${getAssetColor(asset.type)}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setAssets(prev => prev.map(a =>
                      a.id === asset.id ? { ...a, favorite: !a.favorite } : a
                    ))}
                    className={`p-1 rounded-lg ${
                      asset.favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${asset.favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                    {asset.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {asset.size} • {asset.downloads} downloads
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm">
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssets.map((asset, index) => {
            const IconComponent = getAssetIcon(asset.type);
            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${getAssetColor(asset.type)}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full capitalize">
                        {asset.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{asset.size}</span>
                      <span>{asset.downloads} downloads</span>
                      <span>{new Date(asset.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAssets(prev => prev.map(a =>
                        a.id === asset.id ? { ...a, favorite: !a.favorite } : a
                      ))}
                      className={`p-2 rounded-lg ${
                        asset.favorite ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${asset.favorite ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                      <Share className="w-5 h-5" />
                    </button>
                    <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No assets found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientAssetsVault;