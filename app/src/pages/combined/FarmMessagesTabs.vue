<script setup>
// Farm: Messages + Agreements in one screen (agreements start from a chat anyway)
import TabbedPage from '../../components/TabbedPage.vue'
import FarmMessages from '../farmer/FarmMessages.vue'
import FarmAgreements from '../farmer/FarmAgreements.vue'

const tabs = [
  { name: 'chats', label: 'Messages', component: FarmMessages },
  { name: 'agreements', label: 'Agreements', component: FarmAgreements },
]
</script>

<template><TabbedPage :tabs="tabs" /></template>
