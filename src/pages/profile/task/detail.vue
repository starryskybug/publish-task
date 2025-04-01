<script setup>
import Navbar from '@/components/Navbar.vue';
import { ref } from 'vue';
import { onLoad, onUnload } from '@dcloudio/uni-app';
import api from '../../../lib/api-client';
import { ACCOUNT_INFO_KEY } from '../../../lib';

// 用于保存上传文件的状态
const uploadFiles = ref([]); // 存储已上传的文件URL
const selectedFiles = ref([]); // 存储选择的文件临时路径
const loadingRef = ref(false);
const filePicker = ref(null);

onLoad(({ id }) => {
	const accountInfo = uni.getStorageSync(ACCOUNT_INFO_KEY);

	api.GET(`/api/wx/task/details/${id}`).then((resp) => {
		const myTask = resp.data.publishTaskId === accountInfo.userId;

		// 计算已经过去的秒数
		let elapsedSeconds = 0;
		if (resp.data.taskStatus === '2') {
			elapsedSeconds = Math.floor((new Date(resp.data.completeTime).getTime() - new Date(resp.data.publishTaskTime).getTime()) / 1000);
		} else if (resp.data.taskStatus === '1' && resp.data.acceptTaskTime) {
			elapsedSeconds = Math.floor((Date.now() - new Date(resp.data.acceptTaskTime).getTime()) / 1000);
			//接单后，5分钟倒计时
			elapsedSeconds = 300 - elapsedSeconds;
			// console.log(elapsedSeconds)
			task.value.acceptedStatus = true; // 标记为已接单状态
			// console.log(task.value.acceptedStatus)
		} else {
			elapsedSeconds = Math.floor((Date.now() - new Date(resp.data.publishTaskTime).getTime()) / 1000);
			task.value.acceptedStatus = false; // 标记为已发布状态
		}

		const hours = Math.floor(elapsedSeconds / 3600);
		const minutes = Math.floor((elapsedSeconds % 3600) / 60);
		const secs = elapsedSeconds % 60;
		timer.value = `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;

		task.value = {
			id: resp.data.id,
			name: resp.data.taskName,
			// if task is my release, then type is big, else small
			type: myTask ? 'big' : 'small',
			status: parseInt(resp.data.taskStatus),
			myTask,
			completed: resp.data.taskCompletedQuantity,
			total: resp.data.taskTotal,
			url: resp.data.taskLink,
			image: [],
			acceptedStatus: false // 新增：是否已接单状态
		};

		// console.log(task.value.status)
		if (task.value.status === 1) {
			if (task.value.type !== 'big') {
				startTimer(elapsedSeconds, '-');
			} else {
				startTimer(elapsedSeconds, '+');
			}
		}
	});
});

onUnload(() => {
	if (timerInterval) {
		clearInterval(timerInterval);
	}
});

const task = ref({
	id: null,
	name: null,
	type: null, // big 大任务, small 小任务
	time: null,
	status: null,
	myTask: null, // 我发的任务
	completed: null, // 已完成
	total: null, // 总任务数
	url: null,
	image: [],
	acceptedStatus: false // 新增：是否已接单状态
});

const timer = ref('00:00:00');
let timerInterval = null;

// 开始计时
function startTimer(seconds, operation) {
	timerInterval = setInterval(() => {
		if ('operation' === '+') {
			seconds++;
		} else {
			seconds--;
		}
		if (seconds <= 0) {
			seconds = 0;
		}
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		timer.value = `${padZero(hours)}:${padZero(minutes)}:${padZero(secs)}`;
	}, 1000);
}

// 数字补零
function padZero(num) {
	return num.toString().padStart(2, '0');
}

// 复制链接
function copyUrl() {
	uni.setClipboardData({
		data: task.value.url,
		success: () => {
			uni.showToast({
				title: '复制成功',
				icon: 'none'
			});
		}
	});
}

// 获取状态栏样式
function getStatusBarStyle() {
	switch (task.value.status) {
		case 2:
			return {
				bg: '#CCE2E1',
				text: '#006E6B'
			};
		case 1:
			if (task.value.acceptedStatus) {
				return {
					bg: '#D9E9FF',
					text: '#2979FF'
				};
			}
			return {
				bg: '#F8ECBB',
				text: '#FF9500'
			};
		default:
			return {
				bg: '#F8ECBB',
				text: '#FF9500'
			};
	}
}

// 获取状态文本
function getStatusText() {
	switch (task.value.status) {
		case 2:
			return '已完成';
		case 1:
			if (task.value.acceptedStatus) {
				return '已接单';
			}
			return '已发布';
		case 3:
			return '审核中';
		case 4:
			return '审核失败';
		default:
			return '已发布';
	}
}

// 处理文件选择事件
function handleFileSelect(e) {
	console.log('选择文件：', e);
	const newSelectedFiles = e.tempFiles.map((file) => file.path || file.url);
	console.log('已选择文件：', newSelectedFiles);

	// 如果有新选择的文件，则立即上传
	if (newSelectedFiles.length > 0) {
		uploadFiles.value = []; // 清空之前上传的文件
		selectedFiles.value = newSelectedFiles;
		uploadSelectedFiles(newSelectedFiles);
	}
}

// 上传选择的文件
function uploadSelectedFiles(files) {
	if (!files || files.length === 0) {
		return;
	}

	loadingRef.value = true;

	// 记录上传成功的图片URL
	const uploadedUrls = [];
	let uploadedCount = 0;
	const totalFiles = files.length;

	// 显示上传加载中
	uni.showLoading({
		title: '上传中...'
	});

	// 对每个文件进行上传
	files.forEach((filePath, index) => {
		api.uploadImage({
			url: '/api/common/upload',
			filePath: filePath,
			name: 'file',
			formData: {
				taskId: task.value.id
			}
		})
			.then((res) => {
				console.log(`第${index + 1}张图片上传成功:`, res);
				// 保存上传成功的图片URL
				if (res.data) {
					uploadedUrls.push(res.data);
				}
			})
			.catch((err) => {
				console.error(`第${index + 1}张图片上传失败:`, err);
			})
			.finally(() => {
				uploadedCount++;

				// 所有文件都已处理完成
				if (uploadedCount === totalFiles) {
					uni.hideLoading();
					loadingRef.value = false;

					if (uploadedUrls.length > 0) {
						uploadFiles.value = uploadedUrls;
						uni.showToast({
							title: '上传成功',
							icon: 'success'
						});
					} else {
						uni.showToast({
							title: '上传失败',
							icon: 'none'
						});
					}
				}
			});
	});
}

// 确认提交上传的图片
function confirmUpload() {
	if (uploadFiles.value.length === 0) {
		uni.showToast({
			title: '请先上传截图',
			icon: 'none'
		});
		return;
	}

	loadingRef.value = true;

	// 提交任务完成请求
	api.POST(`/api/wx/taskDetails/complete/${task.value.id}`, {
		urls: uploadFiles.value
	})
		.then((resp) => {
			uni.showToast({
				title: resp.msg,
				icon: 'success'
			});

			// 提交成功后返回上一页
			uni.navigateBack();
		})
		.catch((err) => {
			uni.showToast({
				title: err.msg || '提交失败',
				icon: 'none'
			});
		})
		.finally(() => {
			loadingRef.value = false;
		});
}

// 终止任务
function handleTerminateTask() {
	loadingRef.value = true;
	api.GET(`/api/wx/task/terminate/${task.value.id}`)
		.then((resp) => {
			uni.showToast({
				title: resp.msg,
				icon: 'success'
			});
			uni.navigateBack();
		})
		.catch((err) => {
			uni.showToast({
				title: err.msg,
				icon: 'none'
			});
		})
		.finally(() => {
			loadingRef.value = false;
		});
}
</script>

<template>
	<view>
		<Navbar :title="`${task.type === 'big' ? '大任务' : '小任务'}详情`" />

		<!-- 状态栏 -->
		<view class="py-14rpx text-center mt-20rpx font-bold" :style="{ backgroundColor: getStatusBarStyle().bg, color: getStatusBarStyle().text }">
			<view class="text-36rpx">{{ getStatusText() }}</view>
			<!-- 大任务，并且自己是接单人，展示任务发布市时长 -->
			<view v-if="task.status === 1 && task.type === 'big'" class="text-28rpx">{{ timer }}</view>
			<!-- 小任务，并且自己是接单人，展示任务完成倒计时 -->
			<view v-if="task.status === 1 && task.type !== 'big'" class="text-28rpx">{{ timer }}</view>
		</view>

		<!-- 任务内容 -->
		<view class="px-30rpx py-40rpx">
			<!-- 任务标题 -->
			<view class="flex items-center mb-30rpx">
				<view :class="[task.type === 'big' ? 'task-tag-big' : 'task-tag-small']">
					<view>
						{{ task.type === 'big' ? '大任务' : '小任务' }}
					</view>
				</view>
				<view class="ml-20rpx text-48rpx text-#333 font-bold">{{ task.name }}</view>
			</view>

			<!-- 进度条 -->
			<view v-if="task.type === 'big'" class="mt-48rpx">
				<view class="w-full h-12rpx bg-#CCE4FF rounded-full overflow-hidden">
					<view class="h-full bg-#006E6B" :style="{ width: `${(task.completed / task.total) * 100}%` }"></view>
				</view>
				<view class="text-right text-24rpx text-#006E6B mt-12rpx">{{ task.completed }}/{{ task.total }}</view>
			</view>

			<!-- 截图区域 - 仅在已完成状态显示 -->
			<view v-if="task.status === 'completed'" class="mt-40rpx shadow p-30rpx border border-solid border-#EAEAEA rounded-30rpx">
				<view class="text-32rpx text-#333 font-bold mb-30rpx">截图</view>
				<view class="flex flex-wrap gap-20rpx">
					<view v-for="img in task.image" :key="img" class="w-160rpx h-160rpx border border-solid border-#EAEAEA rounded-20rpx overflow-hidden">
						<image :src="img" mode="aspectFill" class="w-full h-full"></image>
					</view>
				</view>
			</view>

			<!-- 任务链接 -->
			<view class="px-10rpx mt-76rpx">
				<textarea class="border-2 border-solid border-#006E6B rounded-30rpx p-34rpx text-32rpx text-black font-bold w-auto" disabled :value="task.url" />

				<!-- 复制/详情按钮 -->
				<navigator
					v-if="task.myTask"
					:url="`/pages/profile/task/sub-tasks?id=${task.id}`"
					class="mt-30rpx btn-primary py-22rpx text-32rpx text-center rounded-44rpx w-294rpx mx-auto"
				>
					详情
				</navigator>
				<view v-else class="mt-30rpx btn-primary py-22rpx text-32rpx text-center rounded-44rpx w-294rpx mx-auto" @click="copyUrl">复制</view>
			</view>

			<!-- 上传截图区域 - 仅在不是自己的任务，且进行中时显示 -->
			<view v-if="!task.myTask && task.status === 1" class="mt-82rpx shadow p-30rpx border border-solid border-#EAEAEA rounded-30rpx">
				<view class="text-32rpx text-#333 font-bold mb-20rpx">上传截图</view>
				<uni-file-picker
					ref="filePicker"
					limit="9"
					title="选择图片后将自动上传"
					file-mediatype="image"
					mode="grid"
					@select="handleFileSelect"
					:auto-upload="false"
					:sourceType="['album', 'camera']"
					:delIcon="true"
					:file-extname="['jpg', 'png', 'jpeg']"
				></uni-file-picker>

				<!-- 上传状态提示 -->
				<view v-if="loadingRef" class="mt-20rpx text-center text-28rpx text-#FF9500">正在上传图片...</view>

				<!-- 已上传图片列表 -->
				<!-- <view v-if="uploadFiles.length > 0" class="mt-20rpx">
                    <view class="text-28rpx text-#006E6B font-bold mb-10rpx">已上传 {{ uploadFiles.length }} 张图片</view>
                    <view class="flex flex-wrap gap-20rpx">
                        <view 
                            v-for="(img, index) in uploadFiles" 
                            :key="index" 
                            class="w-160rpx h-160rpx border border-solid border-#EAEAEA rounded-20rpx overflow-hidden"
                        >
                            <image 
                                :src="img"
                                mode="aspectFill"
                                class="w-full h-full"
                            ></image>
                        </view>
                    </view>
                </view> -->
			</view>
		</view>

		<!-- 终止任务按钮 - 仅在进行中且是自己的任务时显示 -->
		<button
			v-if="task.myTask && task.status === 1"
			class="mx-50rpx mt-30rpx btn-primary py-28rpx leading-none text-32rpx text-center rounded-44rpx fixed bottom-50rpx left-0 right-0"
			@click="handleTerminateTask"
			:loading="loadingRef"
			:disabled="loadingRef"
		>
			终止任务
		</button>

		<!-- 确认上传按钮，仅在不是自己的任务，且进行中时显示 -->
		<button
			v-if="!task.myTask && task.status === 1"
			class="mx-50rpx mt-30rpx btn-primary py-28rpx leading-none text-32rpx text-center rounded-44rpx fixed bottom-50rpx left-0 right-0"
			@click="confirmUpload"
			:class="{ 'opacity-50': loadingRef }"
			:disabled="loadingRef"
			:loading="loadingRef"
		>
			{{ loadingRef ? '提交中...' : '确认上传' }}
		</button>
	</view>
</template>
