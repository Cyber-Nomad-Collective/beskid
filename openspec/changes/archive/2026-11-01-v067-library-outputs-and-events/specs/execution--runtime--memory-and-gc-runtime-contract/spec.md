## ADDED Requirements

### Requirement: Event handler words are traced fields
The runtime SHALL store the handlers of an event in the handler words of the owning object, which the owner's type descriptor lists in its pointer map. Every store of a handler word SHALL take the hybrid write barrier. The event operations (`event_subscribe`, `event_unsubscribe_first`, `event_len`, `event_get_handler`) SHALL NOT register or release an external root. At instance shutdown, the external root count SHALL be zero whatever handlers are still subscribed.

#### Scenario: Subscribed handlers hold no root
- **GIVEN** an owner object with two subscribed handlers, rooted through a handle
- **WHEN** a collection runs, then the handle is released and another collection runs
- **THEN** the external root count stays zero, the first collection keeps the owner and both handlers, and the second collection reclaims all three
