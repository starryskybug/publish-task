<script setup>
import Navbar from '@/components/Navbar.vue'
import { reactive, ref } from 'vue'
import api from "../../lib/api-client"
import { onLoad } from '@dcloudio/uni-app'
import { ACCOUNT_INFO_KEY, API_BASE_URL } from '../../lib'

onLoad(() => {
    const accountInfo = uni.getStorageSync(ACCOUNT_INFO_KEY)

    userInfo.name = accountInfo.nickName
    userInfo.phone = accountInfo.userId

    if (!accountInfo.avatar.startsWith('http')) {
        userInfo.avatar = API_BASE_URL + accountInfo.avatar
    }
    else {
        userInfo.avatar = accountInfo.avatar
    }
})

// 用户信息
const userInfo = reactive({
    name: null,
    phone: null,
    avatar: null
})

// popup引用
const popupRef = ref(null)

// 编辑状态的用户信息
const editingUserInfo = reactive({
    name: '',
    avatar: '',
    saveAvatar: null
})

// 打开弹窗编辑用户信息
function openEditUserInfo() {
    // 复制当前信息到编辑框
    editingUserInfo.name = userInfo.name
    editingUserInfo.avatar = userInfo.avatar
    
    // 使用open方法打开弹窗
    popupRef.value.open()
}

// 关闭弹窗
function closePopup() {
    popupRef.value.close()
}

// 保存用户信息
function saveUserInfo() {
    if (!editingUserInfo.name) {
        uni.showToast({
            title: '请输入昵称',
            icon: 'none'
        })
        return
    }


    // 更新用户信息
    userInfo.name = editingUserInfo.name
    userInfo.avatar = editingUserInfo.avatar

    api.POST("/api/wx/my/editUserInfo", {
        nickName: editingUserInfo.name,
        avatar: editingUserInfo.saveAvatar
    }).then(resp => {
        uni.showToast({
            title: resp.msg,
            icon: 'success'
        })
        closePopup()
    }).catch(err => {
        uni.showToast({
            title: err.msg,
            icon: 'none'
        })
    })
}

// 选择图片上传头像
function chooseAvatar() {
    uni.chooseImage({
        count: 1,
        success: async (res) => {
            // 这里实际应用中应该上传到服务器获取URL
            // 这里简单示例直接使用本地临时路径
            const tempFilePath = res.tempFilePaths[0]
            try {
                const resp = await api.uploadImage({
                    url: "/api/common/upload",
                    filePath: tempFilePath,
                    name: 'file'
                })
                let data = resp.data
                editingUserInfo.saveAvatar = data

                if (!data.startsWith('http')) {
                    data = API_BASE_URL + data
                }
                editingUserInfo.avatar = data
            } catch (err) {
                console.log(err)
                uni.showToast({
                    title: err.msg,
                    icon: 'none'
                })
            }
        }
    })
}

// 监听弹窗状态变化
function popupChange(e) {
    console.log('popup状态变化：', e.show)
}
</script>

<template>
    <view class="min-h-screen bg">
        <Navbar title="个人中心" :show-back="false" />
        
        <!-- 用户信息区域 -->
        <view class="mx-30rpx mt-88rpx flex items-center" @click="openEditUserInfo">
            <image :src="userInfo.avatar" class="w-110rpx h-110rpx rounded-full" mode="aspectFill" />
            <view class="ml-10rpx">
                <view class="text-32rpx font-bold text-#333">{{ userInfo.name }}</view>
                <view class="text-24rpx text-#999 mt-10rpx">{{ userInfo.phone }}</view>
            </view>
            <image src="/static/profile/arrow-right.png" class="w-30rpx h-30rpx ml-auto" mode="aspectFit" />
        </view>
        
        <!-- 菜单项 -->
        <view class="bg-white rounded-30rpx px-40rpx mx-30rpx mt-50rpx">
            <!-- 我的任务 -->
            <navigator url="/pages/profile/task/index" class="flex justify-between items-center py-36rpx border-b border-b-solid border-#EEEEEE">
                <view class="flex items-center">
                    <image src="/static/profile/wallet.png" class="w-40rpx h-40rpx" mode="aspectFit" />
                    <text class="text-32rpx font-medium text-#333 ml-20rpx">我的任务</text>
                </view>
                <image src="/static/profile/arrow-right.png" class="w-30rpx h-30rpx" mode="aspectFit" />
            </navigator>
            
            <!-- 我的佣金 -->
            <navigator url="/pages/profile/wallet/index" class="flex justify-between items-center py-36rpx">
                <view class="flex items-center">
                    <image src="/static/profile/star.png" class="w-40rpx h-40rpx" mode="aspectFit" />
                    <text class="text-32rpx font-medium text-#333 ml-20rpx">我的佣金</text>
                </view>
                <image src="/static/profile/arrow-right.png" class="w-30rpx h-30rpx" mode="aspectFit" />
            </navigator>
        </view>

        <!-- 用户信息编辑弹窗 -->
        <uni-popup ref="popupRef" type="bottom" background-color="#fff" border-radius="20rpx 20rpx 0 0" @change="popupChange">
            <view class="p-30rpx">
                <view class="text-right text-30rpx text-#666 mb-30rpx" @click="closePopup">
                    关闭
                </view>
                
                <!-- 头像上传 -->
                <view class="flex flex-col items-center mb-50rpx">
                    <image :src="editingUserInfo.avatar" class="w-150rpx h-150rpx rounded-full border border-solid border-#EEEEEE" mode="aspectFill" @click="chooseAvatar" />
                </view>
                
                <!-- 昵称输入 -->
                <view class="mb-30rpx">
                    <view class="text-28rpx mb-10rpx">昵称</view>
                    <input 
                        type="text" 
                        v-model="editingUserInfo.name" 
                        class="border border-solid border-#EEEEEE rounded-10rpx p-20rpx" 
                        placeholder="请输入昵称"
                    />
                </view>
                
                <!-- 保存按钮 -->
                <button 
                    class="w-full btn-primary py-20rpx text-28rpx rounded-full"
                    @click="saveUserInfo"
                >
                    保存
                </button>
            </view>
        </uni-popup>
    </view>
</template>
