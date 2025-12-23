# Documentation Guide

This guide helps you find the right documentation for your needs.

---

## 📖 For Different Audiences

### 🎯 Executives & Product Managers
**Start here**: [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)
- High-level status of all features
- Timeline to production
- Resource requirements
- Decision points
- Business impact

### 👨‍💻 Software Engineers
**Start here**: [CURRENT_STATUS_AND_NEXT_STEPS.md](CURRENT_STATUS_AND_NEXT_STEPS.md)
- Complete technical status
- Implementation details
- Phase-by-phase breakdowns
- Code integration requirements
- Testing requirements

### 🏃 Daily Standups
**Start here**: [QUICK_STATUS_REFERENCE.md](QUICK_STATUS_REFERENCE.md)
- TL;DR status
- Critical blockers
- Resource allocation
- Standup questions

### 🎰 Slot Machine Specific
**Start here**: [SLOT_MACHINE_IMPLEMENTATION_SUMMARY.md](SLOT_MACHINE_IMPLEMENTATION_SUMMARY.md)
- Complete slot machine status
- Security compliance checklist
- API endpoints
- Integration TODOs

---

## 📚 By Topic

### Status & Planning
- [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md) - Non-technical overview
- [CURRENT_STATUS_AND_NEXT_STEPS.md](CURRENT_STATUS_AND_NEXT_STEPS.md) - Technical deep dive
- [QUICK_STATUS_REFERENCE.md](QUICK_STATUS_REFERENCE.md) - Daily reference

### Feature Documentation
- [SLOT_MACHINE_IMPLEMENTATION_SUMMARY.md](SLOT_MACHINE_IMPLEMENTATION_SUMMARY.md) - Slot machine backend
- [XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md](XXXCHATNOW_SLOT_MACHINE_BRIEFING_v1.md) - Original requirements

### Architecture & Integration
- [XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md](XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md) - Integration rules
- [MASTER_TRANSITION_AND_INTEGRATION_BRIEFING.md](MASTER_TRANSITION_AND_INTEGRATION_BRIEFING.md) - System architecture

### Development Guidelines
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development workflow
- [COPILOT_GOVERNANCE.md](COPILOT_GOVERNANCE.md) - AI coding standards
- [SECURITY_AUDIT_POLICY_AND_CHECKLIST.md](SECURITY_AUDIT_POLICY_AND_CHECKLIST.md) - Security requirements
- [AI_ONBOARDING.md](AI_ONBOARDING.md) - AI assistant guidelines

---

## 🚦 Current Status Quick View

| Feature | Status | Document |
|---------|--------|----------|
| **Slot Machine** | ✅ Backend Done<br>⏸️ Blocked on Queue | [Details](SLOT_MACHINE_IMPLEMENTATION_SUMMARY.md) |
| **Model Menus** | ⚠️ Partial | [Details](CURRENT_STATUS_AND_NEXT_STEPS.md#2-model-menus-status) |
| **Performance Queue** | 📋 Design Only | [Details](CURRENT_STATUS_AND_NEXT_STEPS.md#3-performance-queue-status) |

---

## 🔍 Finding Specific Information

### "How do I integrate with the Performance Queue?"
→ [Integration Contract](XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md)

### "What's the slot machine API?"
→ [Slot Machine Summary - API Endpoints](SLOT_MACHINE_IMPLEMENTATION_SUMMARY.md#api-endpoints)

### "What security requirements must I follow?"
→ [Security Audit Policy](SECURITY_AUDIT_POLICY_AND_CHECKLIST.md)

### "What's blocking production deployment?"
→ [Executive Summary - Blocking Issues](EXECUTIVE_SUMMARY.md#current-state)

### "How do I contribute code?"
→ [Contributing Guide](CONTRIBUTING.md)

### "What's the weekly progress?"
→ Check [QUICK_STATUS_REFERENCE.md](QUICK_STATUS_REFERENCE.md) (updated weekly)

---

## 📅 Document Update Schedule

| Document | Update Frequency | Last Updated |
|----------|------------------|--------------|
| QUICK_STATUS_REFERENCE.md | Weekly | Dec 23, 2025 |
| EXECUTIVE_SUMMARY.md | Weekly | Dec 23, 2025 |
| CURRENT_STATUS_AND_NEXT_STEPS.md | Bi-weekly | Dec 23, 2025 |
| SLOT_MACHINE_IMPLEMENTATION_SUMMARY.md | As needed | Dec 23, 2025 |

---

## 💡 Tips for Using This Documentation

1. **New to the project?** Start with [README.md](README.md) then [EXECUTIVE_SUMMARY.md](EXECUTIVE_SUMMARY.md)

2. **Starting implementation?** Read the relevant feature document first, then [Integration Contract](XXXCHATNOW_INTERACTIVE_FEATURE_INTEGRATION_CONTRACT_v1.md)

3. **In a meeting?** Have [QUICK_STATUS_REFERENCE.md](QUICK_STATUS_REFERENCE.md) open

4. **Blocked on something?** Check [CURRENT_STATUS_AND_NEXT_STEPS.md](CURRENT_STATUS_AND_NEXT_STEPS.md) for dependencies

5. **Need to make a decision?** Review [EXECUTIVE_SUMMARY.md - Decision Points](EXECUTIVE_SUMMARY.md#decision-points-needed)

---

## 📞 Getting Help

If you can't find what you need:
1. Check if there's a specific module README in `api/src/modules/[module-name]/README.md`
2. Search for keywords across all .md files
3. Contact the engineering team lead

---

**Last Updated**: December 23, 2025  
**Maintainer**: Engineering Team
