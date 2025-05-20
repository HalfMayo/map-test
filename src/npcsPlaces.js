const npcs = [
    {
        name: 'John Doe',
        description: 'Fisherman',
        dialogue: [
            {
                actor: 'npc',
                line: '0: lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean varius odio eget arcu porta varius.'
            },
            {
                actor: 'mc',
                line: '1: nam at leo eleifend, efficitur est et, consequat neque. In hac habitasse platea dictumst. Donec a accumsan magna.'
            },
            {
                actor: 'npc',
                line: '2: quisque et ex ut massa tincidunt dapibus. Duis efficitur nisl purus, ac sodales mauris semper rutrum. Aenean efficitur placerat aliquam.'
            },
            {
                actor: 'mc',
                line: '3: proin lacus ante, hendrerit at lectus et, dapibus venenatis est. Vivamus sollicitudin mollis magna, sed sollicitudin mauris sollicitudin eget. Sed metus leo, elementum sit amet nibh sit amet, elementum sagittis risus. Suspendisse rutrum venenatis velit ac vulputate. Sed et sapien tortor. Maecenas imperdiet arcu quis urna viverra, malesuada vehicula tellus pellentesque. Integer pharetra ligula felis, in porttitor dolor lacinia sit amet.'
            },
            {
                actor: 'npc',
                line: '4: in at felis ut enim feugiat dictum et nec orci. Curabitur venenatis, dui a posuere blandit, quam odio volutpat lectus, at pretium elit augue et nisl.'
            },
            {
                actor: 'mc',
                line: '5: fusce viverra metus eu pulvinar sollicitudin. Sed hendrerit faucibus dictum. In posuere sagittis quam, vitae sodales augue viverra vel. In eleifend, mauris ac pulvinar tempor, sem ipsum rhoncus nunc, eu consectetur lectus odio id orci.'
            }
        ]
    }
]

const places = [
    {
        name: "Fisherman's house",
        longDescription: ['1: Ut tortor risus, dapibus malesuada enim vel, rutrum tincidunt massa. Aliquam eleifend, risus vitae porta malesuada, ligula nisi aliquet quam, nec lacinia massa massa at magna. Nunc laoreet massa ut orci ornare, et auctor erat consectetur.',
            '2: Pellentesque laoreet, justo nec placerat dapibus, augue sapien mattis turpis, tincidunt placerat tellus magna sed ipsum. Cras lobortis nisi lorem, id semper justo convallis a. Suspendisse eget velit tempor, interdum risus vitae, porta felis. Nulla eget consectetur eros. Nam blandit vel dolor sit amet interdum.']

    },
    {
        name: "Chef's house",
        longDescription: ['Ut tortor risus, dapibus malesuada enim vel, rutrum tincidunt massa. Aliquam eleifend, risus vitae porta malesuada, ligula nisi aliquet quam, nec lacinia massa massa at magna. Nunc laoreet massa ut orci ornare, et auctor erat consectetur. Pellentesque laoreet, justo nec placerat dapibus, augue sapien mattis turpis, tincidunt placerat tellus magna sed ipsum. Cras lobortis nisi lorem, id semper justo convallis a. Suspendisse eget velit tempor, interdum risus vitae, porta felis. Nulla eget consectetur eros. Nam blandit vel dolor sit amet interdum.']
    }
]

export {npcs, places}