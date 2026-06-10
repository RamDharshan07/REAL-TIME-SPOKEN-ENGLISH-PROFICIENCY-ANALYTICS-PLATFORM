# Real-Time Spoken English Proficiency Analytics

A full-stack web application for **spoken English practice** and **measurable fluency feedback**. Users rehearse through a live AI voice agent, sentence drills, and timed picture-description tasks—then review transcript-based analytics and progress trends in the browser.

## Overview

Most speaking practice tools offer unstructured recording or subjective feedback. This project combines:

- **Live AI conversation** (Vapi) for realistic spoken practice  
- **100+ articulation drills** with strict word-level scoring  
- **60-second picture-talk assessments** with a consistent rubric  
- **Explainable NLP metrics** on captured transcripts (fillers, repetition, lexical diversity, clarity signals)  
- **Two analytics dashboards** for practice sessions and picture-talk history  

Session data is stored locally in the browser for this demo—no account required.

## Highlights

| Capability | Description |
|------------|-------------|
| **AI voice practice** | Real-time conversational agent; user speech saved as transcript |
| **Fluency analytics** | Rule-based + statistical NLP on text (0–100 scores) |
| **Sentence drills** | Tongue-twister cards; pass at 100% word match |
| **Picture talk** | 8 curated scenes; 4-metric rubric (fluency, fillers, scene detail, pace) |
| **Progress tracking** | Trend charts for practice and picture-talk runs |
| **Privacy-friendly demo** | Client-side scoring; history in `localStorage` |

