with
    minutes as (
        select
            presentation.presentation,
            activity.activity,
            presentation.date,
            count(minute.minute) as count
        from 
            minute
            inner join presentation on minute.presentation= presentation.presentation
            inner join activity on presentation.activity = activity.activity
            inner join project on activity.project = project.project
            inner join workplan on project.workplan = workplan.workplan
        where 
            workplan.year=2024
        group by
            activity.activity,
            presentation.date
    ),

    contributions as (
        select
            presentation.presentation,
            activity.activity,
            presentation.date,
            count(contribution.contribution) as count
        from 
            contribution
            inner join minute on contribution.minute = minute.minute
            inner join presentation on minute.presentation= presentation.presentation
            inner join activity on presentation.activity = activity.activity
        group by
            activity.activity,
            presentation.date
    ),
    #
    #Join the total minutes with total contributions
    presentation as (
        select 
            minutes.activity,
            minutes.date,
            json_object('value', concat_ws('/', minutes.count, contributions.count), 'presentation', minutes.presentation) as cell_value
        from
            minutes
            left join contributions on contributions.date= minutes.date
                                    and contributions.activity= minutes.activity
    )