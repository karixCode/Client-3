Vue.component('task-component', {
    props: {
        task: {
            type: Object,
            required: true
        },
        taskIndex: {
            type: Number,
            required: true
        },
        disabled: {
            type: Boolean,
            default: false
        }
    },
    template: `
        <li>
            <label>
                <input type="checkbox" v-model="task.completed" :disabled="disabled" @change="$emit('task-updated')">
                {{ task.text }}
            </label>
        </li>
    `
})

Vue.component('card-component', {
    props: {
        card: {
            type: Object,
            required: true
        },
        cardIndex: {
            type: Number,
            required: true
        },
        columnIndex: {
            type: Number,
            required: true
        },
        isFirstColumnBlocked: {
            type: Boolean,
            default: false
        }
    },
    template: `
        <div 
            class="card"
            :draggable="!isFirstColumnBlocked && !card.completedAt"
            @dragstart="onDragStart"
            @dragover.prevent
            @drop="onDrop"
            :data-index="cardIndex"
        >
            <h3>{{ card.title }}</h3>
            <ul>
                <task-component
                    v-for="(task, index) in card.tasks"
                    :key="index"
                    :task="task"
                    :taskIndex="index"
                    :disabled="isFirstColumnBlocked || !!card.completedAt"
                    @task-updated="$emit('task-updated', cardIndex)">
                </task-component>
            </ul>
            <button v-if="canAddTask" @click="addTask">Добавить пункт</button>
            <p v-if="card.completedAt">Завершено: {{ card.completedAt }}</p>
        </div>
    `,
    computed: {
        canAddTask() {
            return this.columnIndex === 0 && !this.card.completedAt && this.card.tasks.length < 5 && !this.isFirstColumnBlocked
        }
    },
    methods: {
        addTask() {
            const text = prompt('Введите задачу')
            console.log(text)
            if (text) this.$emit('add-task', text)
        },
        onDragStart(event) {
            event.dataTransfer.setData('text/plain', this.cardIndex);
        },
        onDrop(event) {
            // Index элемента, который нужно переместить
            const draggedCardIndex = event.dataTransfer.getData('text/plain');
            // Index элемента, с которым нужно поменять
            const targetCardIndex = event.currentTarget.dataset.index;

            if (draggedCardIndex !== targetCardIndex) {
                this.$emit('move-card-in-column', draggedCardIndex, targetCardIndex);
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
        },
        isFirstColumnBlocked: {
            type: Boolean,
            default: false
        }
    },
    template: `
        <div class="column">
            <h2>{{ column.title }}({{column.cards.length}})</h2>
            <card-component 
                v-for="(card, index) in column.cards"
                :key="card.id"
                :card="card"
                :cardIndex="index"
                :columnIndex="columnIndex"
                :is-first-column-blocked="isFirstColumnBlocked"
                @add-task="(text) => $emit('add-task', columnIndex, index, text)"
                @task-updated="$emit('task-updated', columnIndex, index)"
                @move-card-in-column="moveCardInColumn">
            </card-component>
            <button v-if="canAddCard" @click="$emit('add-card')">Добавить карточку</button>
        </div>
    `,
    computed: {
        canAddCard() {
            return this.columnIndex === 0 && this.column.cards.length < 3 && !this.isFirstColumnBlocked
        }
    },
    methods: {
        moveCardInColumn(draggedCardIndex, targetCardIndex) {
            const draggedCard = this.column.cards.splice(draggedCardIndex, 1)[0];
            this.column.cards.splice(targetCardIndex, 0, draggedCard);
            this.saveData();
        },
        saveData() {
            localStorage.setItem("columns", JSON.stringify(this.columns))
        }
    }
});


new Vue({
    el: '#app',
    data() {
        return {
            columns: JSON.parse(localStorage.getItem("columns")) || [
                {
                    title: "Новые",
                    cards: [
                        { id: 1, title: "Card 1", tasks: [{ text: "Task 1", completed: false }, { text: "Task 2", completed: false }] },
                        { id: 2, title: "Card 2", tasks: [{ text: "Task 3", completed: false }, { text: "Task 4", completed: false }] }
                    ]
                },
                { title: "В процессе", cards: [{ id: 3, title: "Card 3", tasks: [{ text: "Task 5", completed: false }, { text: "Task 6", completed: true }] }] },
                { title: "Завершенные", cards: [] }
            ],
            isModalVisible: false,
            newCard: { title: '', tasks: [{ text: '', completed: false }, { text: '', completed: false }, { text: '', completed: false }] },
        }
    },
    computed: {
        isFirstColumnBlocked() {
            return this.columns[1].cards.length >= 5
        }
    },
    methods: {
        openModal(value = true) {
            this.isModalVisible = value
        },
        addCard() {
            this.columns[0].cards.push({
                id: Date.now(),
                title: this.newCard.title,
                tasks: this.newCard.tasks,
                completedAt: null
            })

            this.openModal(false)
            this.newCard = { title: '', tasks: [{ text: '', completed: false }, { text: '', completed: false }, { text: '', completed: false }] }

            this.saveData()
        },
        addTask(columnIndex, cardIndex, text) {
            console.log(columnIndex, cardIndex, text)
            this.columns[columnIndex].cards[cardIndex].tasks.push({ text, completed: false })
            this.saveData()
        },
        updateColumns(columnIndex, cardIndex) {
            const tasks = this.columns[columnIndex].cards[cardIndex].tasks
            const completedTasks = tasks.filter(item => item.completed)
            const progress = completedTasks.length / tasks.length

            if (columnIndex === 0 && progress > 0.5 && this.columns[1].cards.length < 5) this.moveCard(columnIndex, cardIndex, 1)
            else if (progress === 1) this.moveCard(columnIndex, cardIndex, 2)
            this.saveData()
        },
        moveCard(columnIndex, cardIndex, toIndex) {
            const [card] = this.columns[columnIndex].cards.splice(cardIndex, 1)
            if (toIndex === 2) card.completedAt = new Date().toLocaleString()
            this.columns[toIndex].cards.push(card)
            this.saveData()
        },
        saveData() {
            localStorage.setItem("columns", JSON.stringify(this.columns))
        }
    }
})

