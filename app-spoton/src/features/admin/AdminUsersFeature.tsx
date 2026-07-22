import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import apiClient from '@/lib/http';

interface User {
  _id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  branch_id?: { _id: string; name: string };
  created_at: string;
}

interface Branch {
  _id: string;
  name: string;
}

export function AdminUsersFeature() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBranchSelect, setShowBranchSelect] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: 'CUSTOMER',
    branch_id: ''
  });
  
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, branchesRes] = await Promise.all([
        apiClient.get('/users/admin/list'),
        apiClient.get('/branches')
      ]);
      
      if (usersRes.data?.success) {
        setUsers(usersRes.data.data);
      }
      if (branchesRes.data?.success) {
        setBranches(branchesRes.data.data);
      }
    } catch (error) {
      console.log('Error fetching users data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAdd = async () => {
    try {
      if (!formData.full_name || !formData.email || !formData.password || !formData.role) {
        Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin bắt buộc');
        return;
      }
      
      const payload: any = { ...formData };
      if (payload.role === 'ADMIN' || payload.role === 'CUSTOMER') {
        delete payload.branch_id;
      }
      
      await apiClient.post('/users/admin/create', payload);
      Alert.alert('Thành công', 'Đã tạo tài khoản mới');
      setShowAddModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể tạo tài khoản');
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (!editingUser) return;
      
      const payload: any = { role: formData.role };
      if (formData.role !== 'ADMIN' && formData.role !== 'CUSTOMER') {
        payload.branch_id = formData.branch_id;
      }
      
      await apiClient.put(`/users/admin/${editingUser._id}/role`, payload);
      Alert.alert('Thành công', 'Đã cập nhật phân quyền');
      setShowEditModal(false);
      fetchData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
    }
  };

  const handleDelete = (userId: string, role: string) => {
    if (role !== 'CUSTOMER') {
      Alert.alert('Không thể xóa', 'Chỉ có thể xóa tài khoản Khách hàng. Vui lòng giáng cấp về CUSTOMER trước khi xóa.');
      return;
    }
    Alert.alert('Xóa Tài khoản', 'Bạn có chắc chắn muốn xóa khách hàng này?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`/users/admin/${userId}`);
          Alert.alert('Thành công', 'Đã xóa tài khoản');
          fetchData();
        } catch (error: any) {
          Alert.alert('Lỗi', error.message || 'Không thể xóa');
        }
      }}
    ]);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      branch_id: user.branch_id?._id || ''
    });
    setShowEditModal(true);
  };

  const filtered = users.filter(u => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    return true;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700';
      case 'MANAGER': return 'bg-blue-100 text-blue-700';
      case 'WAITER': return 'bg-green-100 text-green-700';
      case 'KITCHEN': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#ea580c" /></View>;
  }

  const selectedBranchName = formData.branch_id 
    ? branches.find(b => b._id === formData.branch_id)?.name || 'Chọn chi nhánh'
    : 'Chưa chọn (Không bắt buộc)';

  const renderForm = (isEdit: boolean = false) => (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      {!isEdit && (
        <>
          <View className="mb-4">
            <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Họ và tên <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={formData.full_name}
              onChangeText={t => setFormData({ ...formData, full_name: t })}
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
              placeholder="Nhập họ tên"
            />
          </View>
          <View className="mb-4">
            <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Email <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={formData.email}
              onChangeText={t => setFormData({ ...formData, email: t.toLowerCase() })}
              autoCapitalize="none"
              keyboardType="email-address"
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
              placeholder="Nhập email"
            />
          </View>
          <View className="mb-4">
            <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Mật khẩu <Text className="text-red-500">*</Text></Text>
            <TextInput
              value={formData.password}
              onChangeText={t => setFormData({ ...formData, password: t })}
              secureTextEntry
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
              placeholder="Nhập mật khẩu"
            />
          </View>
          <View className="mb-4">
            <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Số điện thoại</Text>
            <TextInput
              value={formData.phone}
              onChangeText={t => setFormData({ ...formData, phone: t })}
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-lg px-4 py-3 font-lexend text-gray-900"
              placeholder="Nhập số điện thoại"
            />
          </View>
        </>
      )}

      {isEdit && (
        <View className="mb-4 bg-gray-50 p-4 rounded-lg">
          <Text className="font-lexend font-bold text-gray-900 mb-1">{formData.full_name}</Text>
          <Text className="font-lexend text-xs text-gray-500">{formData.email}</Text>
        </View>
      )}

      <Text className="font-lexend text-sm font-medium text-gray-700 mb-2">Vai trò (Role) <Text className="text-red-500">*</Text></Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {['CUSTOMER', 'WAITER', 'KITCHEN', 'MANAGER', 'ADMIN'].map(role => (
          <TouchableOpacity 
            key={role}
            onPress={() => setFormData({ ...formData, role })}
            className={`px-3 py-2 rounded-lg border ${formData.role === role ? 'bg-orange-50 border-orange-500' : 'bg-white border-gray-300'}`}
          >
            <Text className={`font-lexend text-xs ${formData.role === role ? 'text-orange-700 font-bold' : 'text-gray-600'}`}>{role}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {['MANAGER', 'WAITER', 'KITCHEN'].includes(formData.role) && (
        <View className="mb-8">
          <Text className="font-lexend text-sm font-medium text-gray-700 mb-1">Chi nhánh quản lý <Text className="text-red-500">*</Text></Text>
          <TouchableOpacity 
            onPress={() => setShowBranchSelect(true)}
            className="flex-row justify-between items-center border border-gray-300 rounded-lg px-4 py-3 bg-white"
          >
            <Text className="font-lexend text-gray-900">{selectedBranchName}</Text>
            <FontAwesome name="chevron-down" size={12} color="#6b7280" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-[#F9FAFB]">
      <View className="bg-white px-4 pt-5 pb-3 shadow-sm z-10 border-b border-gray-100">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="font-lexend font-bold text-lg text-gray-900">Tài khoản & Phân quyền</Text>
          <TouchableOpacity 
            onPress={() => {
              setFormData({ full_name: '', email: '', password: '', phone: '', role: 'WAITER', branch_id: '' });
              setShowAddModal(true);
            }}
            className="bg-orange-600 px-3 py-2 rounded-lg flex-row items-center shadow-sm"
          >
            <FontAwesome name="user-plus" size={12} color="white" />
            <Text className="font-lexend font-bold text-white text-xs ml-1.5">Tạo tài khoản</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
          <FontAwesome name="search" size={14} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm tên, email..."
            className="flex-1 font-lexend ml-2 text-sm text-gray-900"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {['ALL', 'ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'CUSTOMER'].map(role => (
            <TouchableOpacity 
              key={role}
              onPress={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-full border mr-2 ${roleFilter === role ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-200'}`}
            >
              <Text className={`font-lexend text-xs font-medium ${roleFilter === role ? 'text-white' : 'text-gray-600'}`}>
                {role === 'ALL' ? 'Tất cả' : role}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item._id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-white p-4 rounded-xl mb-3 border border-gray-100 shadow-sm">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1 mr-2">
                <Text className="font-lexend font-bold text-base text-gray-900">{item.full_name}</Text>
                <Text className="font-lexend text-xs text-gray-500 mt-0.5">{item.email}</Text>
                {item.phone && <Text className="font-lexend text-xs text-gray-500">{item.phone}</Text>}
              </View>
              <View className={`px-2 py-1 rounded ${getRoleColor(item.role).split(' ')[0]}`}>
                <Text className={`font-lexend font-bold text-[10px] ${getRoleColor(item.role).split(' ')[1]}`}>
                  {item.role}
                </Text>
              </View>
            </View>

            {item.branch_id && (
              <View className="flex-row items-center mb-3">
                <FontAwesome name="map-marker" size={12} color="#6b7280" />
                <Text className="font-lexend text-xs text-gray-600 ml-1.5 font-medium">
                  {item.branch_id.name}
                </Text>
              </View>
            )}

            <View className="flex-row justify-end items-center border-t border-gray-50 pt-3 mt-1 gap-2">
              <TouchableOpacity onPress={() => openEditModal(item)} className="px-3 py-1.5 bg-blue-50 rounded-lg">
                <Text className="font-lexend font-bold text-xs text-blue-600">Phân quyền</Text>
              </TouchableOpacity>
              {item.role === 'CUSTOMER' && (
                <TouchableOpacity onPress={() => handleDelete(item._id, item.role)} className="px-3 py-1.5 bg-red-50 rounded-lg">
                  <Text className="font-lexend font-bold text-xs text-red-600">Xóa</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />

      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100 bg-white z-10">
            <Text className="font-lexend font-bold text-lg text-gray-900">Tạo Tài Khoản Nhân Viên</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>
          {renderForm(false)}
          <View className="p-5 border-t border-gray-100 bg-white">
            <TouchableOpacity onPress={handleSaveAdd} className="py-4 bg-orange-600 rounded-xl items-center shadow-sm">
              <Text className="font-lexend font-bold text-white text-lg">Tạo Tài Khoản</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-100 bg-white z-10">
            <Text className="font-lexend font-bold text-lg text-gray-900">Phân Quyền Tài Khoản</Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)} className="p-2 bg-gray-100 rounded-full">
              <FontAwesome name="times" size={16} color="#4b5563" />
            </TouchableOpacity>
          </View>
          {renderForm(true)}
          <View className="p-5 border-t border-gray-100 bg-white">
            <TouchableOpacity onPress={handleSaveEdit} className="py-4 bg-blue-600 rounded-xl items-center shadow-sm">
              <Text className="font-lexend font-bold text-white text-lg">Cập Nhật Quyền</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showBranchSelect} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-2xl p-5 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="font-lexend font-bold text-lg text-gray-900">Chọn Chi Nhánh</Text>
              <TouchableOpacity onPress={() => setShowBranchSelect(false)} className="p-2">
                <FontAwesome name="times" size={16} color="#4b5563" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {branches.map(branch => (
                <TouchableOpacity 
                  key={branch._id}
                  onPress={() => {
                    setFormData({ ...formData, branch_id: branch._id });
                    setShowBranchSelect(false);
                  }}
                  className={`py-4 border-b border-gray-100 flex-row justify-between items-center ${formData.branch_id === branch._id ? 'bg-orange-50 px-2 rounded-lg border-b-0' : ''}`}
                >
                  <Text className={`font-lexend ${formData.branch_id === branch._id ? 'text-orange-700 font-bold' : 'text-gray-700'}`}>
                    {branch.name}
                  </Text>
                  {formData.branch_id === branch._id && <FontAwesome name="check" size={14} color="#ea580c" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
