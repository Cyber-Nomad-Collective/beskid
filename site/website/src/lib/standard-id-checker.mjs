export function resolveStandardSearch(index, value) {
	const identifier = String(value ?? '').trim();
	return index.find((item) => item.identifier === identifier)?.href ?? null;
}

export function bindStandardIdChecker({
	form,
	field,
	status,
	index,
	navigate,
	updateQuery,
}) {
	form.addEventListener('submit', (event) => {
		event.preventDefault();
		const identifier = field.value.trim();
		const destination = resolveStandardSearch(index, identifier);
		if (destination) {
			navigate(destination);
			return;
		}
		updateQuery(identifier);
		status.textContent = identifier
			? `No Standard catalog record matches “${identifier}”.`
			: 'Enter a capability key or stable Standard ID.';
		status.hidden = false;
	});
}
