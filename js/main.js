Vue.component('card-component', {
    props: {
        card: {
            type: Object,
            required: true
        },
    },
    template: `
        <div class="card">
            <h3>{{ card.title }}</h3>
            <p>{{ card.description }}</p>
            <p><strong>Создано:</strong> {{ card.createdAt }}</p>
            <p><strong>Дедлайн:</strong> {{ card.deadline }}</p>
            <p><strong>Последнее редактирование:</strong> {{ card.updatedAt || 'Не редактировалось' }}</p>
            <button v-if="[0, 1, 2].includes(columnIndex)" @click="$emit('edit-card')">Редактировать</button>
        </div>
    `
})

Vue.component('column-component', {
    props: {
        column: {
            type: Object,
            required: true
        },
        columnIndex: {
            type: Number,
            required: true
        }
    },
    template: `
        <div class="column">
            <h2>{{ column.title }} ({{ column.cards.length }})</h2>
            <card-component
                v-for="(card, index) in column.cards"
                :key="card.id"
                :card="card"
                @edit-card="$emit('edit-card', columnIndex, index)"
            </card-component>
            <button v-if="columnIndex === 0" @click="$emit('add-card')">Добавить карточку</button>
        </div>
    `
})

new Vue({
    el: '#app',
    data() {
        return {
            columns: JSON.parse(localStorage.getItem("columns")) || [
                { title: "Запланированные задачи", cards: [] },
                { title: "Задачи в работе", cards: [] },
                { title: "Тестирование", cards: [] },
                { title: "Выполненные задачи", cards: [] }
            ],
            isModalVisible: false,
            isEditing: false,
            currentCard: {
                title: '',
                description: '',
                deadline: '',
                createdAt: '',
                updatedAt: ''
            },
            editIndex: null
        }
    },
    methods: {
        openModal() {
            this.isModalVisible = true
            this.isEditing = false
            this.currentCard = {
                title: '',
                description: '',
                deadline: '',
                createdAt: new Date().toLocaleString(),
                updatedAt: ''
            }
        },
        editCard(columnIndex, cardIndex) {
            this.isModalVisible = true
            this.isEditing = true
            this.currentCard = { ...this.columns[columnIndex].cards[cardIndex] }
            this.editIndex = { columnIndex, cardIndex }
        },
        saveCard() {
            if (this.isEditing) {
                this.currentCard.updatedAt = new Date().toLocaleString()
                Vue.set(this.columns[this.editIndex.columnIndex].cards, this.editIndex.cardIndex, { ...this.currentCard })
            } else {
                this.columns[0].cards.push({ ...this.currentCard, id: Date.now() })
            }
            this.closeModal()
            this.saveData()
        },
        closeModal() {
            this.isModalVisible = false
        },
        saveData() {
            localStorage.setItem("columns", JSON.stringify(this.columns))
        }
    }
})