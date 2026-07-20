import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Platform, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Branch {
  _id: string;
  name: string;
}

export function AdminFinanceFeature() {
  const [activeTab, setActiveTab] = useState<'STATS' | 'TRANSACTIONS' | 'REFUNDS'>('STATS');
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL'); // 'ALL' or branch_id
  const [showBranchSelect, setShowBranchSelect] = useState(false);

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Đầu tháng
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Data state
  const [stats, setStats] = useState({ total_revenue: 0, total_refunds: 0, net_revenue: 0, count: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);

  // Fetch Branches once
  useEffect(() => {
    apiClient.get('/branches').then(res => {
      if (res.data?.success) {
        setBranches(res.data.data || []);
      }
    }).catch(err => console.log('Error fetching branches:', err));
  }, []);

  // Fetch Data based on tab and filters
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Build query string
      // start_date is midnight of startDate, end_date is 23:59:59 of endDate
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      const query = `?branch_id=${selectedBranch}&start_date=${start.toISOString()}&end_date=${end.toISOString()}`;

      if (activeTab === 'STATS') {
        const res = await apiClient.get(`/finance/revenue${query}`);
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } else if (activeTab === 'TRANSACTIONS') {
        const res = await apiClient.get(`/finance/transactions${query}`);
        if (res.data?.success) {
          setTransactions(res.data.data);
        }
      } else if (activeTab === 'REFUNDS') {
        // refunds may not need strict date filtering depending on requirements, but we pass it anyway or let backend decide
        const res = await apiClient.get(`/finance/refunds?branch_id=${selectedBranch}`);
        if (res.data?.success) {
          setRefunds(res.data.data);
        }
      }
    } catch (error) {
      console.log('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedBranch, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onChangeStart = (event: any, selectedDateValue?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDateValue) {
      setStartDate(selectedDateValue.toISOString().split('T')[0]);
    }
  };

  const onChangeEnd = (event: any, selectedDateValue?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDateValue) {
      setEndDate(selectedDateValue.toISOString().split('T')[0]);
    }
  };

  const selectedBranchName = selectedBranch === 'ALL' 
    ? 'Tất cả chi nhánh' 
    : branches.find(b => b._id === selectedBranch)?.name || 'Đang chọn...';

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      {/* Header & Tabs */}
      <View className="bg-white px-4 pt-5 pb-3 shadow-sm z-10 border-b border-gray-100">
        <View className="flex-row items-center mb-4">
          <FontAwesome name="line-chart" size={18} color="#ea580c" style={{ marginRight: 8 }} />
          <Text className="font-lexend font-bold text-xl text-gray-900">Quản lý Tài chính</Text>
        </View>

        {/* Filters */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity 
            onPress={() => setShowBranchSelect(true)}
            className="flex-1 flex-row justify-between items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
          >
            <View className="flex-row items-center">
              <FontAwesome name="map-marker" size={12} color="#6b7280" style={{ marginRight: 6 }} />
              <Text className="font-lexend text-xs text-gray-700 font-medium line-clamp-1" numberOfLines={1}>{selectedBranchName}</Text>
            </View>
            <FontAwesome name="chevron-down" size={10} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity 
            onPress={() => setShowStartPicker(true)}
            className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
          >
            <FontAwesome name="calendar" size={12} color="#6b7280" style={{ marginRight: 6 }} />
            <Text className="font-lexend text-xs text-gray-700">Từ: {startDate}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowEndPicker(true)}
            className="flex-1 flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
          >
            <FontAwesome name="calendar" size={12} color="#6b7280" style={{ marginRight: 6 }} />
            <Text className="font-lexend text-xs text-gray-700">Đến: {endDate}</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row bg-gray-100 p-1 rounded-lg">
          <TouchableOpacity 
            onPress={() => setActiveTab('STATS')}
            className={`flex-1 py-2 items-center rounded-md ${activeTab === 'STATS' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-lexend text-xs font-bold ${activeTab === 'STATS' ? 'text-gray-900' : 'text-gray-500'}`}>Tổng quan</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('TRANSACTIONS')}
            className={`flex-1 py-2 items-center rounded-md ${activeTab === 'TRANSACTIONS' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-lexend text-xs font-bold ${activeTab === 'TRANSACTIONS' ? 'text-gray-900' : 'text-gray-500'}`}>Sổ cái</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('REFUNDS')}
            className={`flex-1 py-2 items-center rounded-md ${activeTab === 'REFUNDS' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`font-lexend text-xs font-bold ${activeTab === 'REFUNDS' ? 'text-gray-900' : 'text-gray-500'}`}>Hoàn tiền</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-4 pt-4">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : (
          <>
            {activeTab === 'STATS' && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-blue-50 p-5 rounded-2xl mb-4 border border-blue-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-lexend text-sm text-blue-700 font-medium">Tổng doanh thu</Text>
                    <View className="bg-white p-1.5 rounded-full">
                      <FontAwesome name="arrow-up" size={12} color="#2563eb" />
                    </View>
                  </View>
                  <Text className="font-lexend font-bold text-3xl text-blue-900">
                    +{stats.total_revenue.toLocaleString('vi-VN')}đ
                  </Text>
                  <Text className="font-lexend text-xs text-blue-600 mt-2">Tổng số giao dịch thu: {stats.count}</Text>
                </View>

                <View className="bg-red-50 p-5 rounded-2xl mb-4 border border-red-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-lexend text-sm text-red-700 font-medium">Tổng hoàn tiền</Text>
                    <View className="bg-white p-1.5 rounded-full">
                      <FontAwesome name="arrow-down" size={12} color="#dc2626" />
                    </View>
                  </View>
                  <Text className="font-lexend font-bold text-3xl text-red-900">
                    -{stats.total_refunds.toLocaleString('vi-VN')}đ
                  </Text>
                </View>

                <View className="bg-green-50 p-5 rounded-2xl mb-4 border border-green-100">
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="font-lexend text-sm text-green-700 font-medium">Doanh thu thực tế (Net)</Text>
                    <View className="bg-white p-1.5 rounded-full">
                      <FontAwesome name="dollar" size={12} color="#16a34a" />
                    </View>
                  </View>
                  <Text className="font-lexend font-bold text-3xl text-green-900">
                    {stats.net_revenue > 0 ? '+' : ''}{stats.net_revenue.toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              </ScrollView>
            )}

            {activeTab === 'TRANSACTIONS' && (
              <FlatList
                data={transactions}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isIncome = item.amount > 0;
                  return (
                    <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-row items-center">
                          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isIncome ? 'bg-green-100' : 'bg-red-100'}`}>
                            <FontAwesome name={isIncome ? 'arrow-down' : 'arrow-up'} size={12} color={isIncome ? '#16a34a' : '#dc2626'} />
                          </View>
                          <View>
                            <Text className="font-lexend font-bold text-sm text-gray-900">
                              {item.reason}
                            </Text>
                            <Text className="font-lexend text-[10px] text-gray-500 mt-0.5">
                              {new Date(item.date).toLocaleString('vi-VN')}
                            </Text>
                          </View>
                        </View>
                        <Text className={`font-lexend font-bold text-base ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                          {isIncome ? '+' : '-'}{Math.abs(item.amount).toLocaleString('vi-VN')}đ
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center pt-2 border-t border-gray-50 mt-1">
                        <Text className="font-lexend text-xs text-gray-500">Mã HĐ: #{item.booking_id?._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
                        <Text className="font-lexend text-xs font-medium text-orange-600">
                          📍 {item.branch_id?.name || 'Chi nhánh'}
                        </Text>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View className="items-center justify-center py-20">
                    <FontAwesome name="file-text-o" size={32} color="#d1d5db" />
                    <Text className="font-lexend text-gray-500 mt-3">Không có giao dịch nào.</Text>
                  </View>
                }
              />
            )}

            {activeTab === 'REFUNDS' && (
              <FlatList
                data={refunds}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isCompleted = item.status === 'REFUND_COMPLETED';
                  const refundAmount = item.refund_info?.refund_amount || 0;
                  
                  return (
                    <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
                      <View className="flex-row justify-between items-start mb-2">
                        <View>
                          <Text className="font-lexend font-bold text-sm text-gray-900 mb-1">
                            Mã HĐ: #{item._id.slice(-6).toUpperCase()}
                          </Text>
                          <Text className="font-lexend text-xs text-gray-500">
                            Khách: {item.customer_id?.full_name || item.walk_in_name || 'Khách vãng lai'}
                          </Text>
                        </View>
                        <View className={`px-2 py-1 rounded ${isCompleted ? 'bg-purple-100' : 'bg-red-100'}`}>
                          <Text className={`font-lexend font-bold text-[10px] ${isCompleted ? 'text-purple-700' : 'text-red-700'}`}>
                            {isCompleted ? 'Đã hoàn tiền' : 'Yêu cầu hoàn tiền'}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="bg-gray-50 p-3 rounded-lg mb-2">
                        <View className="flex-row justify-between mb-1">
                          <Text className="font-lexend text-xs text-gray-500">Số tiền hoàn:</Text>
                          <Text className="font-lexend font-bold text-sm text-red-600">
                            {refundAmount.toLocaleString('vi-VN')}đ
                          </Text>
                        </View>
                        {item.refund_info?.refund_reason && (
                          <View className="flex-row justify-between">
                            <Text className="font-lexend text-xs text-gray-500">Lý do:</Text>
                            <Text className="font-lexend text-xs text-gray-800 flex-1 text-right ml-2">{item.refund_info.refund_reason}</Text>
                          </View>
                        )}
                      </View>
                      
                      <View className="flex-row justify-between items-center">
                        <Text className="font-lexend text-[10px] text-gray-400">
                          Cập nhật: {new Date(item.updatedAt).toLocaleString('vi-VN')}
                        </Text>
                        <Text className="font-lexend text-[10px] font-bold text-orange-600">
                          📍 {item.branch_id?.name || 'Chi nhánh'}
                        </Text>
                      </View>
                    </View>
                  );
                }}
                ListEmptyComponent={
                  <View className="items-center justify-center py-20">
                    <FontAwesome name="check-circle" size={32} color="#d1d5db" />
                    <Text className="font-lexend text-gray-500 mt-3">Không có yêu cầu hoàn tiền nào.</Text>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>

      {/* Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={new Date(startDate)}
          mode="date"
          display="default"
          onChange={onChangeStart}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={new Date(endDate)}
          mode="date"
          display="default"
          onChange={onChangeEnd}
        />
      )}

      {/* Branch Select Modal */}
      <Modal visible={showBranchSelect} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-lexend font-bold text-lg text-gray-900">Lọc theo Chi Nhánh</Text>
              <TouchableOpacity onPress={() => setShowBranchSelect(false)} className="p-2">
                <FontAwesome name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              <TouchableOpacity 
                onPress={() => {
                  setSelectedBranch('ALL');
                  setShowBranchSelect(false);
                }}
                className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${selectedBranch === 'ALL' ? 'bg-orange-50 px-2 rounded-lg border-b-0' : ''}`}
              >
                <Text className={`font-lexend ${selectedBranch === 'ALL' ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
                  Tất cả chi nhánh
                </Text>
                {selectedBranch === 'ALL' && <FontAwesome name="check" size={14} color="#ea580c" />}
              </TouchableOpacity>

              {branches.map(branch => (
                <TouchableOpacity 
                  key={branch._id}
                  onPress={() => {
                    setSelectedBranch(branch._id);
                    setShowBranchSelect(false);
                  }}
                  className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${selectedBranch === branch._id ? 'bg-orange-50 px-2 rounded-lg border-b-0' : ''}`}
                >
                  <Text className={`font-lexend ${selectedBranch === branch._id ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
                    {branch.name}
                  </Text>
                  {selectedBranch === branch._id && <FontAwesome name="check" size={14} color="#ea580c" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
