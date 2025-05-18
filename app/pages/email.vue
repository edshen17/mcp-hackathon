<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const issue = ref('')
const isValid = ref(false)
const loading = ref(false)

function validateEmail(emailStr: string) {
  // Simple email regex
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(emailStr)
}

function validateForm() {
  isValid.value = validateEmail(email.value) && issue.value.trim().length > 0
}

async function submitForm() {
  if (!isValid.value)
    return
  loading.value = true
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        problemDescription: issue.value,
      }),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    const { result } = await response.json()

    try {
      const newResponse = await fetch('http://localhost:10001/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `In the repo https://github.com/edshen17/mcp-hackathon. Can you create an issue based off this? ${result[0].text}
          1. Write the user's name, email, and the issue.`,
        }),
      })
      if (!newResponse.ok) {
        const errorData = await newResponse.json()
        throw new Error(errorData.error || `HTTP error! status: ${newResponse.status}`)
      }
      const newResult = await newResponse.json()
      console.warn('Second submission successful:', newResult)
    }
    catch (error) {
      console.error('Second submission error:', error)
      // Handle submission error for the new request
    }
  }
  catch (error) {
    console.error('Submission error:', error)
    // Handle submission error, e.g., show an error message
  }
  finally {
    loading.value = false
  }
  // Add your submit logic (e.g., API call) here
}
</script>

<template>
  <div class="form-container">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner" />
      <span>Submitting...</span>
    </div>
    <label>
      Email:
      <input v-model="email" type="email" placeholder="Enter your email" :disabled="loading" @input="validateForm">
    </label>
    <label>
      Problem Description:
      <textarea v-model="issue" placeholder="Describe your issue" :disabled="loading" @input="validateForm" />
    </label>
    <button
      :disabled="!isValid || loading"
      :class="{ disabled: !isValid || loading }"
      @click="submitForm"
    >
      Submit
    </button>
  </div>
</template>

<style scoped>
.form-container {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 700px;
  margin: 4rem auto;
  background: #fff;
  border-radius: 32px;
  padding: 4.5rem 3rem;
  box-shadow:
    0 16px 48px 0 rgba(60, 60, 60, 0.22),
    0 4px 16px 0 rgba(0, 0, 0, 0.13);
  color: #222;
  font-size: 0.95rem;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 32px;
  font-size: 1.1rem;
  font-weight: 500;
  color: #3a7bd5;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.spinner {
  width: 38px;
  height: 38px;
  border: 4px solid #3a7bd5;
  border-top: 4px solid #00c3ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

label {
  display: flex;
  flex-direction: column;
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #222;
}

input,
textarea {
  margin-top: 0.4rem;
  width: 100%;
  padding: 0.65rem 0.9rem;
  font-size: 0.92rem;
  border: none;
  border-radius: 8px;
  background: #f5f7fa;
  color: #222;
  transition:
    background 0.3s,
    box-shadow 0.3s,
    transform 0.2s;
  box-shadow: 0 2px 8px rgba(60, 60, 60, 0.07);
  outline: none;
}

input:focus,
textarea:focus {
  background: #e3e9f1;
  box-shadow:
    0 0 0 2px #3a7bd5,
    0 2px 8px rgba(60, 60, 60, 0.12);
  transform: scale(1.02);
}

button {
  padding: 0.65rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(90deg, #3a7bd5 0%, #00c3ff 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow:
    0 4px 16px rgba(58, 123, 213, 0.15),
    0 1.5px 6px 0 rgba(0, 0, 0, 0.1);
  transition:
    background 0.3s,
    transform 0.2s,
    box-shadow 0.3s;
}

button.disabled,
button:disabled {
  background: #b0b8c1;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

button:hover:enabled {
  background: linear-gradient(90deg, #00c3ff 0%, #3a7bd5 100%);
  transform: translateY(-2px) scale(1.04);
  box-shadow:
    0 8px 24px rgba(58, 123, 213, 0.22),
    0 2px 8px rgba(0, 0, 0, 0.13);
}

::placeholder {
  color: #888;
  opacity: 1;
}
</style>
