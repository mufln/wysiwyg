# wysiwyg  
1. Загрузка статей в формате пдф, md  
2. Парсинг статьи при загрузке   
	1. вычленение формулы и ее обработка  
		2. поиск формулы
		3. анализ контекста через llama на hugging face
			4. унификация обозначений
		4. индексация формулы (где она находится внутри статьи - ссылка на страницу и саму статью)
	2. открытие доступа к статье по id.
 3. Редактор формул  
 	4. Ебистика для фронтенда  
		5. Редактор формул  
			6. Отрисовка LaTex  
			7. string формат (поле ввода)  
		6. Клавиатура с математическими функциями  
	5. Экран сравнения с базой  
		6. Введенная формула | полученная с разметкой совпадений  
	6. Поиск формулы (похожих) по базе  
		6. Магия бекенда по поиску похожих формул через (не)бинарные деревья  
		7. Возвращение списка похожих формул  
			1. Для каждой формулы список кортежей с индексами совпадений [(3, 5), (10, 14)]  
5. Фичи?!!!?!?! (Если все сделаем и будет время)  
	5. Покупка доступа к фуллу (статье)  
 
