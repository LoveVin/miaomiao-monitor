<script setup lang="ts">
import { captureMessage } from '@miaomiao/monitor-vue'

captureMessage('Vue demo ready')

function throwError() {
    throw new Error('喵喵监控 Vue 测试错误')
}
</script>

<template>
    <main>
        <h1>Vue 监控 Demo</h1>
        <p>点击按钮触发错误，然后在监控平台查看上报结果。</p>
        <button type="button" @click="throwError">触发测试错误</button>
    </main>
</template>
