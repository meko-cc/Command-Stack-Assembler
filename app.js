(() => {
  const mode = document.body.dataset.mode === 'fast' ? 'fast' : 'slow';
  const positionInput = document.getElementById('position');
  const form = document.getElementById('command-form');
  const commandInput = document.getElementById('command');
  const output = document.getElementById('output_text');
  const status = document.getElementById('output-status');
  const addButton = document.getElementById('add-block');
  const clearButton = document.getElementById('clear-stack');
  const copyButton = document.getElementById('copy-output');
  const listWrap = document.getElementById('stack-list-wrap');
  const list = document.getElementById('stack-list');
  const count = document.getElementById('stack-count');
  const blocks = [];

  const typeLabels = {
    impulse: 'Impulse',
    chain: 'Chain',
    repeating: 'Repeat'
  };

  const blockIds = {
    impulse: 'command_block',
    chain: 'chain_command_block',
    repeating: 'repeating_command_block'
  };

  function selectedValue(name) {
    return form.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
  }

  function currentBlock() {
    return {
      position: positionInput.value.trim(),
      type: selectedValue('command_type') || 'impulse',
      conditional: selectedValue('conditional') === 'true',
      alwaysActive: selectedValue('always_active') === 'true',
      direction: form.elements.direction.value,
      command: commandInput.value.trim().replace(/\s*\r?\n\s*/g, ' ')
    };
  }

  function quoteNbt(value) {
    const escaped = String(value)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n');
    return `"${escaped}"`;
  }

  function isValidPosition(position) {
    const tokens = position.trim().split(/\s+/);
    const coordinate = /^(?:~(?:-?(?:\d+(?:\.\d*)?|\.\d+))?|\^(?:-?(?:\d+(?:\.\d*)?|\.\d+))?|-?(?:\d+(?:\.\d*)?|\.\d+))$/;
    if (tokens.length === 1) return coordinate.test(tokens[0]);
    if (tokens.length !== 3) return false;
    return tokens.every(token => coordinate.test(token));
  }

  function slowFallingBlock(block, index, stack) {
    const id = index === 0 ? '' : 'id:falling_block,';
    const state = `BlockState:{id:${blockIds[block.type]},properties:{facing:"${block.direction}",conditional:"${block.conditional}"}}`;
    const tile = `TileEntityData:{auto:${block.alwaysActive ? 1 : 0},Command:${quoteNbt(block.command)}}`;
    const next = index + 1 < stack.length
      ? slowFallingBlock(stack[index + 1], index + 1, stack)
      : '{id:falling_block,BlockState:{id:air}}';
    return `{${id}${state},${tile},Passengers:[{id:armor_stand,Health:0,Passengers:[${next}]}]}`;
  }

  function buildSlowCommand(stack, position) {
    return `/summon minecraft:falling_block ${position} ${slowFallingBlock(stack[0], 0, stack)}`;
  }

  function placementCommand(block) {
    const state = `${blockIds[block.type]}[conditional=${block.conditional},facing=${block.direction}]`;
    const tile = `{auto:${block.alwaysActive ? 1 : 0},Command:${quoteNbt(block.command)}}`;
    return `/setblock ${block.position} ${state}${tile}`;
  }

  function minecart(command) {
    return `{id:command_block_minecart,Command:${quoteNbt(command)}}`;
  }

  function buildFastCommand(stack) {
    const placementMinecarts = stack.map(block => minecart(placementCommand(block)));
    const cleanupBlock = '/setblock ~ ~1 ~ command_block{auto:1,Command:"/fill ~ ~ ~ ~ ~-3 ~ air"}';
    const cleanupMinecart = minecart(cleanupBlock);
    const killMinecart = minecart('/kill @e[type=command_block_minecart]');
    const passengers = [...placementMinecarts, cleanupMinecart, killMinecart].join(',');
    return `/summon minecraft:falling_block ~ ~1 ~ {BlockState:{id:"minecraft:redstone_block"},Passengers:[{id:"minecraft:falling_block",BlockState:{id:"minecraft:activator_rail"},Passengers:[${passengers}]}]}`;
  }

  function blocksForFastPreview() {
    const draft = currentBlock();
    const stack = [...blocks];
    if (draft.command || !stack.length) stack.push(draft);
    return stack;
  }

  function renderOutput() {
    output.value = '';
    output.placeholder = 'Output generates here…';
    copyButton.disabled = true;
    status.classList.remove('is-error');

    if (mode === 'slow') {
      const stack = [currentBlock(), ...blocks];
      output.value = buildSlowCommand(stack, positionInput.value.trim());
      copyButton.disabled = false;
      status.textContent = blocks.length
        ? `${blocks.length} saved command ${blocks.length === 1 ? 'block' : 'blocks'} below the current editable block.`
        : 'Ready — edit this block, then add its command to the passenger stack.';
      return;
    }

    const stack = blocksForFastPreview();
    if (!stack.length) {
      status.textContent = 'Add a command to preview your stack.';
      return;
    }

    const invalidBlock = stack.find(block => block.position && !isValidPosition(block.position));
    if (invalidBlock) {
      status.textContent = 'Enter one coordinate or three valid coordinates for each block, or leave the position blank.';
      status.classList.add('is-error');
      return;
    }

    output.value = buildFastCommand(stack);
    copyButton.disabled = false;
    status.textContent = '';
  }

  function renderStackList() {
    list.replaceChildren();
    listWrap.hidden = blocks.length === 0;
    count.textContent = `${blocks.length} ${blocks.length === 1 ? 'BLOCK' : 'BLOCKS'}`;

    blocks.forEach((block, index) => {
      const item = document.createElement('li');
      item.className = 'stack-item';

      const number = document.createElement('span');
      number.className = 'stack-item-number';
      number.textContent = String(index + 1).padStart(2, '0');

      const details = document.createElement('span');
      details.className = 'stack-item-copy';
      const title = document.createElement('span');
      title.className = 'stack-item-title';
      title.textContent = `${typeLabels[block.type]} command block`;
      const snippet = document.createElement('span');
      snippet.className = 'stack-item-command';
      snippet.textContent = mode === 'fast'
        ? `${block.position} · ${block.command}`
        : block.command;
      details.append(title, snippet);

      const remove = document.createElement('button');
      remove.className = 'remove-block';
      remove.type = 'button';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove command block ${index + 1}`);
      remove.addEventListener('click', () => {
        blocks.splice(index, 1);
        renderStackList();
        renderOutput();
      });

      item.append(number, details, remove);
      list.append(item);
    });
  }

  function addCurrentBlock() {
    const block = currentBlock();
    if (!block.command) {
      status.textContent = 'Enter a command before adding another block.';
      status.classList.add('is-error');
      commandInput.focus();
      return;
    }
    if (blocks.length >= 64) {
      status.textContent = 'This stack has reached the 64-block limit.';
      status.classList.add('is-error');
      return;
    }
    blocks.push(block);
    commandInput.value = '';
    renderStackList();
    renderOutput();
    commandInput.focus();
  }

  function clearStack() {
    blocks.splice(0, blocks.length);
    positionInput.value = '';
    form.reset();
    commandInput.value = '';
    renderStackList();
    renderOutput();
    positionInput.focus();
  }

  async function copyOutput() {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      status.textContent = 'Command copied to clipboard.';
      status.classList.remove('is-error');
    } catch {
      output.focus();
      output.select();
      const copied = document.execCommand('copy');
      status.textContent = copied ? 'Command copied to clipboard.' : 'Select the command above and copy it.';
      status.classList.toggle('is-error', !copied);
    }
  }

  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', renderOutput);
  form.addEventListener('change', renderOutput);
  positionInput.addEventListener('input', renderOutput);
  addButton.addEventListener('click', addCurrentBlock);
  clearButton.addEventListener('click', clearStack);
  copyButton.addEventListener('click', copyOutput);

  renderStackList();
  renderOutput();
})();
