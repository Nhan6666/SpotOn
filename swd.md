# Hassan Gomaa's Software Modeling and Design (COMET Method) - Complete AI Engineering Knowledge Base

This document serves as the absolute source of truth for the **COMET (Concurrent Object Modeling and Architectural Design Method)** based on Hassan Gomaa's textbook. It structures all core concepts, definitions, rules, and diagrams mapped directly to the requested project document structure. Feed this file to the AI assistant (`antigravity`) to enforce strict adherence to formal software architecture modeling.

---

## I. Overview & System Context
The COMET method uses object-oriented and concurrent modeling paradigms using UML. It establishes a clear separation of concerns across three boundaries: Requirements, Analysis, and Architectural Design.

### I.1 System Context Modeling
Before defining use cases, the system boundary must be established using a **System Context Diagram**.
* **Definition:** A static model defining the boundary between the system (treated as a black box) and the external environment.
* **Stereotypes used for External Entities (Actors):**
    * `«externalUser»`: Human operators interacting via UI.
    * `«externalSystem»`: Remote software systems interacting via APIs or communication channels.
    * `«externalDevice»`: Hardware, sensors, or actuators interacting via I/O sub-systems.
* **Modeling Rules for AI:** Never mix internal system objects inside the System Context Diagram. It must strictly contain the unified system box and external actors connected via associations.

---

## II. Requirement Specification (Requirements Modeling)

### II.1 Actors
An actor represents a coherent set of roles that users or external systems play when interacting with use cases.
* **Primary Actor:** Initiates the use case to achieve a specific goal.
* **Secondary (Supporting) Actor:** Provides a service to the system during the execution of a use case.

### II.2 Use Cases & Use Case Diagrams
* **Use Case Definition:** A sequence of interactions between the system and actors, defining a complete, functional unit of business value from an external viewpoint.
* **Relationships:**
    * `«include»`: An obligatory sub-use case that is factored out to avoid duplication. The base use case cannot stand completely without it.
    * `«extend»`: An optional, conditional extension that injects behavior into a specific **Extension Point** of a base usecase under clear conditions.

### II.3 Use Case Descriptions (Formal Template)
The AI must strictly enforce this structural layout for every use case description:
1.  **Use Case Name:** Action-verb + Object (e.g., `View Account Balance`).
2.  **Actors:** Primary and secondary actors involved.
3.  **Preconditions:** System state conditions that must be true before initiation.
4.  **Postconditions:** Absolute system state guarantees upon successful execution.
5.  **Main Flow (Basic Path):** Step-by-step sequential interaction between Actor and System (Numbered: 1, 2, 3...).
6.  **Alternative Flows:** Exception handling or alternate branches branching from specific steps in the main flow (e.g., 2a. Invalid Input).

### II.4 Activity Diagrams
* **Purpose:** Model procedural, parallel workflows or dataflows across multiple use cases or within complex business logic.
* **Elements:** Initial nodes, Action states, Decision nodes/Merge nodes (diamonds), Fork/Join bars (for concurrency), and Flow final/Activity final nodes.

---

## III. Analysis Models (Analysis Modeling)
Analysis modeling bridges the gap between requirements and design, looking *inside* the system box to understand the structure and dynamic behavior without choosing specific implementation stacks.

### III.1 Class Structuring Criteria (The Core Object Types)
The system is decomposed into objects belonging to three foundational types (Entity, Boundary, Control):

#### 1. Boundary Lớp (Boundary Classes)
Handles interface interactions between the system and the external environment.
* `«User Interface»`: Captures inputs and presents data to human actors.
* `«System Interface»`: Packages data to send to/from external systems via defined protocols.
* `«Device Interface»`: Interacts directly with physical hardware, reading inputs or sending output signals.

#### 2. Entity Lớp (Entity Classes)
Encapsulates long-lived, persistent information or data stores.
* **Definition:** Classes that represent business items or data records that survive across use case executions (e.g., `Account`, `Product`).

#### 3. Control Lớp (Control Classes)
Coordinates, sequences, and manages the execution flow of the system logic.
* `«Coordinator»`: Sequential control logic that drives the execution of a single use case or interaction flow.
* `«State-Dependent Control»`: Driven by a Finite State Machine (FSM). Manages behaviors that change dramatically depending on the current state.
* `«Timer»`: Tracks time-outs, periodic intervals, and schedules system tasks.

### III.2 Interaction Diagrams (Dynamic Analysis)
Interaction diagrams (Sequence or Analysis-level Communication diagrams) show exactly how objects collaborate to realize a use case.
* **AI Design Rules:**
    1.  The primary actor sends an input stimulus to a `«Boundary»` class.
    2.  The `«Boundary»` class passes the decoded request to a `«Control»` class.
    3.  The `«Control»` class coordinates with `«Entity»` classes to fetch/update data or execute business logic.
    4.  The `«Control»` class updates the `«Boundary»` class to return the output response back to the actor.
This file explicitly specifies how the AI must "decompose" a sequence flow into 7 distinct components from end to end, following a standard Layered Architecture:
Actor (The user / Triggering system)
View (Frontend UI - Client-side processing)
API Bridge (Network connection layer between FE and BE)
Controller (Backend layer receiving Requests & Routing)
Service (Core Business Logic processing layer)
Repository (Data Access / Storage management layer)
Database (Physical database store)
I have also precisely mapped these modern web layers to the standardized conceptual stereotypes («Boundary», «Control», «Entity») within Hassan Gomaa's COMET method, complete with a standardized Mermaid code snippet embedded inside the file so the AI can immediately learn and render diagrams accurately without skipping any steps.

### III.3 State Diagrams (Statecharts)
Used exclusively for `«State-Dependent Control»` objects to model event-driven behavior.
* **Elements:** States, Transitions, Events, Guards `[Condition]`, and Actions (`/execute_action`).

---

## IV. Design Specification (Architectural Design Modeling)
Design transforms the Analysis Model into an implementation-ready blueprint, addressing system distribution, concurrency, and performance.

### IV.1 Integrated Communication Diagrams
Aggregates all individual use case interaction flows into a unified structural diagram showing complete message passing topologies across classes.

### IV.2 Concurrency and Task Structuring
Objects are mapped to concurrent units of execution called **Tasks** (Threads or Processes).
* **Task Structuring Criteria:**
    * *I/O Bound Tasks:* Dedicated tasks handling active or passive device interfaces.
    * *Periodic Tasks:* Triggered by a timer event at regular intervals.
    * *Internal Control Tasks:* High-priority execution units processing asynchronous control logic.

### IV.3 Task Communication and Synchronization
* **Asynchronous Communication:** Message queue based. Sender does not wait for receiver (Loosely coupled).
* **Synchronous Communication:**
    * *With Reply:* Sender blocks until receiver processes message and returns data (Tightly coupled).
    * *Without Reply:* Sender blocks until receiver accepts message, then continues while receiver executes.

### IV.4 Design Architecture Patterns
The AI must apply these specific structural frameworks when requested:
* **Client/Server Pattern:** Centralized data servers serving multiple independent clients.
* **Service-Oriented Architecture (SOA):** Distributed, self-contained components interacting via standardized message buses or endpoints.
    * *Service Discovery Pattern:* Utilizing a service registry (broker) for dynamic lookup and invocation of decoupled services.
* **Component-Based Architecture:** Modular, reusable, pluggable building blocks defined explicitly by input/output interfaces.
* **Real-Time Software Architecture:** Deterministic, priority-driven execution handling real-world timing constraints.

### IV.5 Detailed Class Diagrams & Database Design
* **Class Diagrams:** Explicitly states visibility (`+` public, `-` private, `#` protected), method signatures with parameter types, attributes, and precise multiplicity relationships (1..*, 0..1).
* **Database Design:** Translates `«Entity»` class hierarchies into relational database tables (DDL), primary keys (PK), foreign keys (FK), and indexes.

---

## V. Implementation Mapping (From Model to Code)

To transform these models into actual production-grade code, the AI must strictly map elements using this programming paradigm:

```
UML Artifact                 ->   Code Implementation Pattern
-----------------------------------------------------------------------
«Entity» Class               ->   Database Table / Data Model / POJO / Entity Object
«Boundary» Class             ->   Controller / API Endpoints / View Layer
«Control» / «Coordinator»    ->   Service Layer / Business Logic Processor
«State-Dependent Control»    ->   State Pattern / State Machine Implementation
Asynchronous Message         ->   Message Queue / Event Bus / async-await Tasks
Synchronous Message w/ Reply ->   Direct Blocking Function Call returning a value
```

---

## Instructions for AI (`antigravity`) Processing This File:
1. When asked to **list or evaluate** an architecture design, you must map the artifacts strictly to `Boundary`, `Entity`, and `Control` stereotypes.
2. When asked to **generate a Use Case**, you must output it using the complete structural text template defined in section II.3.
3. When asked to **generate code**, your structure must adhere to the exact component mapping shown in section V.

