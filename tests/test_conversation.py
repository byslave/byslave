from sohbet.conversation import ConversationMemory


def test_history_keeps_system_and_turns() -> None:
    memory = ConversationMemory(system_prompt="sen sohbet arkadaşısın")
    memory.add_user("merhaba")
    memory.add_assistant("hey")
    payload = memory.as_api_messages()
    assert payload[0] == {"role": "system", "content": "sen sohbet arkadaşısın"}
    assert payload[1]["role"] == "user"
    assert payload[2]["content"] == "hey"


def test_clear_history() -> None:
    memory = ConversationMemory(system_prompt="x")
    memory.add_user("a")
    memory.add_assistant("b")
    memory.clear()
    assert memory.messages == []
    assert memory.as_api_messages() == [{"role": "system", "content": "x"}]


def test_trim_old_turns() -> None:
    memory = ConversationMemory(system_prompt="x", max_turns=2)
    for i in range(5):
        memory.add_user(f"u{i}")
        memory.add_assistant(f"a{i}")
    assert len(memory.messages) == 4
    assert memory.messages[0].content == "u3"
    assert memory.last_assistant() == "a4"
