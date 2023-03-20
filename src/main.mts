import { window, Hack as HackBase, Ajax, Ne } from '@cuclh/userscript-base';

type LessonData = {};

class Hack extends HackBase {
	static instance: Hack = null;

	static lessonCategories = [
		{
			name: '计划内课程',
			key: 'JHNKC',
		},
		{
			name: '方案内课程',
			key: 'FANKC',
		},
		{
			name: '跨专业课程',
			key: 'KZYKC',
		},
		{
			name: '通识课程',
			key: 'TSKC',
		},
		{
			name: '重修课程',
			key: 'QXKC',
		},
	];

	get token(): string {
		return window.sessionStorage.getItem('token');
	}
	get studentInfo(): any {
		return JSON.parse(window.sessionStorage.getItem('studentInfo'));
	}

	async QueryLessons(key: string): Promise<any> {
		const ajax = new Ajax('/xsxkapp/sys/xsxkapp/elective/programCourse.do', 'POST');
		const headers = {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'X-Requested-With': 'XMLHttpRequest',
			'token': this.token,
		};
		for(const [name, value] of Object.entries(headers))
			ajax.header.set(name, value);
		const querySetting = {
			querySetting: JSON.stringify({
				data: {
					studentCode: this.studentInfo.code,
					campus: this.studentInfo.campus,
					electiveBatchCode: this.studentInfo.electiveBatch.code,
					isMajor: '1',
					teachingClassType: key,
					queryContent: ''
				},
				pageSize: '10',
				pageNumber: '0',
				order: '',
			}),
		};
		const formData = new FormData();
		formData.append('querySetting', JSON.stringify(querySetting))
		ajax.payload = new URLSearchParams(formData as unknown as string).toString();
		return JSON.parse(await ajax.Post());
	}

	async PollLesson(data: LessonData) {
		const ajax = new Ajax('/sys/xsxkapp/elective/volunteer.do', 'POST');
		const headers = {
			'X-Requested-With': 'XMLHttpRequest',
			'token': this.token,
		};
		for(const [name, value] of Object.entries(headers))
			ajax.header.set(name, value);
		ajax.payload = JSON.stringify(data);
		return await ajax.Post();
	}

	constructor() {
		super();
		Hack.instance = this;

		const states = {
			'list': {
				validate: () => {
					const url = new URL(window.location.href);
					const pathname = url.pathname.slice(1).split('/');
					return pathname[pathname.length - 1] === 'grablessons.do';
				},
				load: () => {
					const $select = Ne.Create('select', {
						children: [
							Ne.Create('option'),
							...Hack.lessonCategories.map(
								cat => Ne.Create('option', {
									text: cat.name,
									attributes: {
										value: cat.key
									}
								})
							)
						],
						on: {
							async input() {
								const key = this.value;
								if(!key)
									return;
								const result = await Hack.instance.QueryLessons(key);
								console.log(result);
							}
						}
					});
					this.panel.Add($select);
				},
				unload: () => this.panel.Clear(),
			},
			'idle': {
				validate: () => true,
				load: () => {},
			}
		};
		for(const [name, state] of Object.entries(states))
			this.states.set(name, state);

		this.life.on('start', () => {
			this.panel.title = '选课 Hack';
		});

		this.life.on('urlchange', () => this.TriggerAutoTransit());
	}
}

new Hack();