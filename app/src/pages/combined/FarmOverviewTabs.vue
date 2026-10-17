<script setup>
// Farm: Overview + Social impact in one screen
import TabbedPage from '../../components/TabbedPage.vue'
import FarmerHome from '../farmer/FarmerHome.vue'
import FarmImpact from '../farmer/FarmImpact.vue'

const tabs = [
  { name: 'overview', label: 'Overview', component: FarmerHome },
  { name: 'impact', label: 'Social impact', component: FarmImpact },
]
</script>

<template><TabbedPage :tabs="tabs" /></template>
