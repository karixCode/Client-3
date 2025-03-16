Vue.component('card-component', {
    props: {
        card: {
            type: Object,
            required: true
        },
        columnIndex: {
            type: Number,
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
            <button v-if="columnIndex !== 3" @click="$emit('edit-card')">Редактировать</button>
            <button v-if="columnIndex === 0" @click="$emit('delete-card')">Удалить</button>
            <button v-if="columnIndex < 3" @click="$emit('move-card', columnIndex + 1)">Переместить</button>
            <button v-if="columnIndex === 2" @click="returnToWork">Вернуть в работу</button>
        </div>
    `,
    methods: {
        returnToWork() {
            const reason = prompt('Укажите причину возврата:')
            if (reason) {
                this.$emit('move-card', 1, reason)
            }
        }
    }
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
                :columnIndex="columnIndex"
                @edit-card="$emit('edit-card', columnIndex, index)"
                @delete-card="$emit('delete-card', columnIndex, index)"
                @move-card="(toColumnIndex, reason) => $emit('move-card', columnIndex, index, toColumnIndex, reason)">
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
        deleteCard(columnIndex, cardIndex) {
            this.columns[columnIndex].cards.splice(cardIndex, 1)
            this.saveData()
        },
        moveCard(fromColumnIndex, cardIndex, toColumnIndex, reason) {
            const card = this.columns[fromColumnIndex].cards.splice(cardIndex, 1)[0]
            if (toColumnIndex === 3) {
                const deadline = new Date(card.deadline)
                const now = new Date()
                card.status = deadline < now ? 'Просрочено' : 'Выполнено в срок'
            }
            this.columns[toColumnIndex].cards.push(card)
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