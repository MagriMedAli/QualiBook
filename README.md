# AI Lead Qualification & Meeting-Booking Agent

An AI-powered WhatsApp agent for real estate agencies that qualifies incoming leads through natural conversation and books meetings directly on Google Calendar.

Unlike a traditional linear automation pipeline, the system uses an AI Agent with multiple tools. The agent decides what information to collect, when to update the database, when to check calendar availability, and when a meeting should be booked based on the current conversation state.

## Problem

Real estate agencies receive inquiries around the clock through WhatsApp. Manually handling every conversation, collecting qualification information, and scheduling viewings takes time and often results in inconsistent follow-up.

This system automates the initial qualification process while keeping the conversation natural.

The agent collects:

* Budget
* Preferred area
* Buying or renting
* Expected timeline

Once the lead is sufficiently qualified, the agent can handle meeting scheduling without human intervention.

## How It Works

1. A lead sends a message to the agency's WhatsApp number.
2. The workflow looks up the lead in PostgreSQL using their phone number.

   * New phone number → creates a new lead.
   * Existing lead → loads the existing qualification state.
3. The AI Agent uses PostgreSQL-backed conversation memory to maintain context across messages.
4. The agent asks qualifying questions naturally, one at a time.
5. After receiving an answer, the agent calls the `update_lead` tool to immediately persist the information in PostgreSQL.
6. Once the required qualification fields are completed, the lead is marked as qualified.
7. The agent offers to schedule a meeting.
8. When the lead proposes a time:

   * `check_calendar_availability` verifies the requested slot.
   * If available, the agent confirms the time with the lead.
   * Only after confirmation does it call `book_calendar_meeting`.
   * If unavailable, the agent asks the lead for another time.

## Architecture

```text
WhatsApp
   │
   ▼
n8n Workflow
   │
   ├── Lookup / Create Lead
   │       │
   │       ▼
   │   PostgreSQL
   │
   ▼
AI Agent (Gemini)
   │
   ├── PostgreSQL Chat Memory
   │       └── Session ID = Phone Number
   │
   ├── update_lead
   │       └── PostgreSQL
   │
   ├── check_calendar_availability
   │       └── Google Calendar
   │
   └── book_calendar_meeting
           └── Google Calendar
```

## Tools & Technologies

* **n8n** — workflow orchestration and agent execution
* **Google Gemini** — conversational AI agent
* **PostgreSQL** — lead data and conversation memory
* **WhatsApp Business API** — incoming and outgoing messages
* **Google Calendar API** — availability checks and meeting creation

## Agent Design

The key difference from a conventional automation workflow is that the AI Agent has access to multiple tools and determines when each tool should be used.

### `update_lead`

Persists qualification information as soon as the lead provides it instead of waiting until the conversation is complete.

### `check_calendar_availability`

Checks whether a requested meeting time is actually available before anything is booked.

### `book_calendar_meeting`

Creates the calendar event only after the requested time has been checked and confirmed by the lead.

This prevents the agent from blindly creating calendar events.

## Engineering Challenges & Lessons Learned

### 1. `$fromAI()` with PostgreSQL Tools

The n8n `postgresTool` behaves differently from a standard PostgreSQL node when using `$fromAI()` values.

For this setup, AI-generated parameters needed to be embedded directly inside the SQL expression and wrapped in single quotes rather than being passed through the separate Query Parameters field.

### 2. Partial Lead Updates

Updating one qualification field should never erase previously collected information.

The solution was using:

```sql
COALESCE(NULLIF(value, ''), column)
```

This allows individual fields to be updated while preserving existing data.

### 3. Tool Selection

An AI Agent does not reliably use a tool simply because the system prompt tells it to.

Clear tool names and descriptions had a major impact on tool selection.

For example:

```text
update_lead
check_calendar_availability
book_calendar_meeting
```

are significantly clearer to the model than generic names such as:

```text
Execute SQL Query
Run Calendar Operation
```

### 4. Persistent Conversation Memory

The PostgreSQL Chat Memory node needs a consistent session identifier so conversations can survive separate workflow executions.

The session ID is explicitly configured as:

```text
{{ $json.contact_id }}
```

with the Session ID mode set to **Define below**.

In this implementation, the contact/phone identifier provides continuity between WhatsApp messages.

### 5. Safe Calendar Booking

The agent follows a strict scheduling sequence:

```text
Lead proposes time
        ↓
Check availability
        ↓
Available?
   ↙          ↘
 Yes           No
 ↓              ↓
Confirm       Ask for
with lead     another time
 ↓
Book meeting
```

The agent never books a meeting without first checking availability and receiving confirmation from the lead.

## What Makes This Project Different

Most of my earlier automation projects followed a predictable pattern:

```text
Trigger → AI → Action
```

This project required designing an actual stateful AI agent.

The agent must:

* Maintain context across multiple conversations
* Decide which tool to use
* Persist state incrementally
* Handle incomplete information
* Resume conversations after a delay
* Work with existing leads
* Check external system state before taking actions
* Avoid booking meetings without confirmation

This makes the workflow closer to a real production agent architecture than a simple AI-powered automation.

## Testing

The system was tested against scenarios including:

* New leads
* Returning leads
* Multi-turn conversations
* Messy or incomplete replies
* Leads returning after a period of inactivity
* Existing qualification data
* Calendar slots that are unavailable
* Successful meeting bookings

## Status

**Working end-to-end.**

The current implementation successfully handles:

* Lead lookup and creation
* Multi-turn AI qualification
* Persistent conversation memory
* Incremental lead updates
* Calendar availability checking
* Meeting confirmation
* Calendar booking

## Tech Stack

```text
n8n
Google Gemini
PostgreSQL
WhatsApp Business API
Google Calendar API
```
