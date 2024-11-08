<script setup lang="ts">
import type { IConfigCatClient } from '@configcat/sdk';
import { inject } from 'vue'

defineProps<{ msg: string }>()

const isSSR  = inject<boolean>("isSSR");
const configCatClient  = inject<IConfigCatClient>("configCatClient");
const snapshot = configCatClient!.snapshot();
const allKeys = snapshot.getAllKeys();
</script>

<template>
  <h1>{{ msg }}</h1>

  Rendered on <span>{{ isSSR ? "server" : "client" }}</span> side

  <h2>Avaliable setting keys:</h2>

  <ul class="no-bullets">
    <li v-for="item in allKeys">
      {{ item }}
    </li>
  </ul>

</template>

<style scoped>
  ul.no-bullets {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
</style>
